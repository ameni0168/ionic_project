from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime
from app.models.proposal_model import proposal_schema

proposal_bp = Blueprint("proposal_bp", __name__)

def get_db():
    """Helper function to get database instance"""
    return current_app.db

def serialize(doc):
    if doc:
        doc["_id"] = str(doc["_id"])
        if "job_id" in doc:
            doc["job_id"] = str(doc["job_id"]) if isinstance(doc["job_id"], ObjectId) else doc["job_id"]
        if "freelancer_id" in doc:
            doc["freelancer_id"] = str(doc["freelancer_id"])
        if "client_id" in doc:
            doc["client_id"] = str(doc["client_id"])
    return doc

@proposal_bp.route("/", methods=["POST"])
def create_proposal():
    """Create a new proposal"""
    data = request.get_json()
    
    required = ["job_id", "freelancer_id", "client_id", "message", "price"]
    
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400
    
    # Check if job exists
    db = get_db()
    job = db.jobs.find_one({"_id": ObjectId(data["job_id"])})
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    # Check if freelancer already applied for this job
    existing_proposal = db.proposals.find_one({
        "job_id": ObjectId(data["job_id"]),
        "freelancer_id": data["freelancer_id"]
    })
    
    if existing_proposal:
        return jsonify({"error": "You have already applied for this job"}), 400
    
    # Create the proposal
    new_proposal = proposal_schema(
        job_id=ObjectId(data["job_id"]),
        freelancer_id=data["freelancer_id"],
        client_id=data["client_id"],
        message=data["message"],
        price=data["price"],
        estimated_days=data.get("estimated_days"),
        attachments=data.get("attachments", [])
    )
    
    result = db.proposals.insert_one(new_proposal)
    new_proposal["_id"] = str(result.inserted_id)
    
    return jsonify({
        "message": "Proposal submitted successfully",
        "proposal": serialize(new_proposal)
    }), 201

@proposal_bp.route("/job/<job_id>", methods=["GET"])
def get_proposals_by_job(job_id):
    """Get all proposals for a specific job (for client)"""
    try:
        db = get_db()
        proposals = list(db.proposals.find({"job_id": ObjectId(job_id)}).sort("created_at", -1))
        
        # Get freelancer details for each proposal
        for proposal in proposals:
            freelancer = db.users.find_one({"_id": proposal["freelancer_id"]})
            if freelancer:
                proposal["freelancer"] = {
                    "_id": str(freelancer["_id"]),
                    "name": freelancer.get("name", "Unknown"),
                    "email": freelancer.get("email", ""),
                    "skills": freelancer.get("skills", [])
                }
        
        return jsonify({
            "proposals": [serialize(p) for p in proposals],
            "total": len(proposals)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@proposal_bp.route("/freelancer/<freelancer_id>", methods=["GET"])
def get_proposals_by_freelancer(freelancer_id):
    """Get all proposals by a freelancer"""
    try:
        db = get_db()
        proposals = list(db.proposals.find({"freelancer_id": freelancer_id}).sort("created_at", -1))
        
        # Get job details for each proposal
        for proposal in proposals:
            job = db.jobs.find_one({"_id": proposal["job_id"]})
            if job:
                proposal["job"] = {
                    "_id": str(job["_id"]),
                    "title": job.get("title", "Unknown"),
                    "description": job.get("description", ""),
                    "budget_min": job.get("budget_min"),
                    "budget_max": job.get("budget_max")
                }
        
        return jsonify({
            "proposals": [serialize(p) for p in proposals],
            "total": len(proposals)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@proposal_bp.route("/<proposal_id>", methods=["PATCH"])
def update_proposal_status(proposal_id):
    """Accept or reject a proposal"""
    data = request.get_json()
    new_status = data.get("status")
    
    if new_status not in ["accepted", "rejected"]:
        return jsonify({"error": "Invalid status. Must be 'accepted' or 'rejected'"}), 400
    
    try:
        db = get_db()
        result = db.proposals.update_one(
            {"_id": ObjectId(proposal_id)},
            {"$set": {
                "status": new_status,
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Proposal not found"}), 404
        
        # If proposal is accepted, update the job status and reject other proposals
        if new_status == "accepted":
            proposal = db.proposals.find_one({"_id": ObjectId(proposal_id)})
            
            # Update job status to in_progress and assign freelancer
            db.jobs.update_one(
                {"_id": proposal["job_id"]},
                {"$set": {
                    "status": "in_progress",
                    "assigned_freelancer": proposal["freelancer_id"],
                    "updated_at": datetime.utcnow()
                }}
            )
            
            # Reject all other proposals for this job
            db.proposals.update_many(
                {
                    "job_id": proposal["job_id"],
                    "_id": {"$ne": ObjectId(proposal_id)}
                },
                {"$set": {
                    "status": "rejected",
                    "updated_at": datetime.utcnow()
                }}
            )
        
        return jsonify({
            "message": f"Proposal {new_status} successfully",
            "status": new_status
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@proposal_bp.route("/<proposal_id>", methods=["DELETE"])
def delete_proposal(proposal_id):
    """Delete a proposal (only if pending)"""
    try:
        db = get_db()
        proposal = db.proposals.find_one({"_id": ObjectId(proposal_id)})
        
        if not proposal:
            return jsonify({"error": "Proposal not found"}), 404
        
        if proposal["status"] != "pending":
            return jsonify({"error": "Only pending proposals can be deleted"}), 400
        
        result = db.proposals.delete_one({"_id": ObjectId(proposal_id)})
        
        if result.deleted_count == 0:
            return jsonify({"error": "Proposal not found"}), 404
        
        return jsonify({"message": "Proposal deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@proposal_bp.route("/client/<client_id>/jobs-with-proposals", methods=["GET"])
def get_client_jobs_with_proposals(client_id):
    """Get all jobs for a client with their proposals"""
    try:
        db = get_db()
        
        # Get all jobs for this client
        jobs = list(db.jobs.find({"client_id": client_id}).sort("created_at", -1))
        
        result = []
        for job in jobs:
            # Get proposals for this job
            proposals = list(db.proposals.find({"job_id": job["_id"]}).sort("created_at", -1))
            
            # Get freelancer details for each proposal
            for proposal in proposals:
                freelancer = db.users.find_one({"_id": proposal["freelancer_id"]})
                if freelancer:
                    proposal["freelancer"] = {
                        "_id": str(freelancer["_id"]),
                        "name": freelancer.get("name", "Unknown"),
                        "email": freelancer.get("email", "")
                    }
            
            result.append({
                "job": serialize(job),
                "proposals": [serialize(p) for p in proposals],
                "proposals_count": len(proposals)
            })
        
        return jsonify({
            "jobs": result,
            "total": len(result)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400