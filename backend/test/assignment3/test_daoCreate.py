import pytest
from unittest.mock import patch
from src.util.dao import DAO
from pymongo.errors import WriteError, OperationFailure

class TestDaoCreate:
    """
    Patching a hard-coded dependency (of the DAO onto the 
    getValidator and MONGO_URL) using patch and by using a json schema meant for tests only. 
    """

    # We use incorrect syntax for uniqueItems because this is the case in the validators currently,
    # and create method also specifies this as intended behavior.
    test_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["firstName", "lastName", "email"],
            "properties": {
                "firstName": {"bsonType": "string"},
                "lastName": {"bsonType": "string"},
                "email": {"bsonType": "string", "uniqueItems": True},
                "tasks": {
                    "bsonType": "array",
                    "items": {"bsonType": "objectId"}
                }
            }
        }
    }

    example_data = {
    "email": "woods@example.com",
    "firstName": "Tiger",
    "lastName": "Woods"
    }

    @pytest.fixture
    def sut(self):
        with patch.dict('os.environ', {'MONGO_URL': 'mongodb://root:root@edutask-mongodb:27017/test_db?authSource=admin'}):
            with patch('src.util.dao.getValidator', autospec=True) as mockedValidator:
                mockedValidator.return_value = self.test_schema
                dao = DAO('test_collection_integration_tests')
                yield dao
                dao.collection.drop()

    def test_create_document_valid_input(self, sut):
        result = sut.create(self.example_data)

        assert "_id" in result
        assert result["email"] == self.example_data["email"]
        assert result["firstName"] == self.example_data["firstName"]
        assert result["lastName"] == self.example_data["lastName"]

    def test_create_document_missing_required_field(self, sut):
        data = {
        "email": "woods@example.com",
        "firstName": "Tiger"
        }

        with pytest.raises(WriteError) as excinfo:
            sut.create(data)
        assert excinfo.type is WriteError

    def test_create_document_unique_items_not_followed(self, sut):
        sut.create(self.example_data)
        with pytest.raises(WriteError) as excinfo:
            sut.create(self.example_data)
        assert excinfo.type is WriteError

    def test_create_document_incorrect_bson_type(self, sut):
        self.example_data["tasks"] = 55

        with pytest.raises(WriteError) as excinfo:
            sut.create(self.example_data)
        assert excinfo.type is WriteError
