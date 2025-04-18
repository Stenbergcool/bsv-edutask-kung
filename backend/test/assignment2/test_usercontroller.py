import pytest
from unittest.mock import MagicMock
from src.controllers.usercontroller import UserController

@pytest.fixture
def mock_dao():
    return MagicMock()

@pytest.fixture
def user_controller(mock_dao):
    return UserController(dao=mock_dao)

# All of these should raise ValueError
@pytest.mark.parametrize('email', [
    'invalid-email', 
    'invalid-email@', 
    '@invalid-email', 
    '@invalid-email.com', 
    '', 
    '@'
])
def test_get_user_by_email_invalid_email(user_controller, email):
    with pytest.raises(ValueError, match='Error: invalid email address'):
        user_controller.get_user_by_email(email)

def test_get_user_by_email_no_user(user_controller):
    user_controller.dao.find.return_value = []
    result = user_controller.get_user_by_email('test@test.com')
    assert result is None

def test_get_user_by_email_database_throw(user_controller):
    user_controller.dao.find.side_effect = Exception("Database error")
    with pytest.raises(Exception, match='Database error'):
        user_controller.get_user_by_email('test@test.com')

def test_get_user_by_email_two_user_same_email(user_controller, capfd):
    user_controller.dao.find.return_value = ['test@test.com','test@test.com']
    result = user_controller.get_user_by_email('test@test.com')
    out, err = capfd.readouterr()
    assert "Error: more than one user found with mail test@test.com\n" in out
    assert result is 'test@test.com'