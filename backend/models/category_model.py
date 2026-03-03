class CategoryModel:

    @staticmethod
    def create_category(data):
        return {
            "name": data.get("name"),
            "subs": data.get("subs", [])
        }