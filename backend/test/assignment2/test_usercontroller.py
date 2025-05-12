import pytest
from unittest.mock import MagicMock
from src.controllers.usercontroller import UserController

@pytest.fixture
def mock_dao():
    return MagicMock()

@pytest.fixture
def user_controller(mock_dao):
    return UserController(dao=mock_dao)

# Tests invalid email formats - all should raise ValueError
@pytest.mark.parametrize('email', [
    'invalid-email', 
    'invalid-email@', 
    '@invalid-email', 
    '@invalid-email.com', 
    '', 
    '@',
    1,
    {'email': 'test@test.com'},
    [1, 2, 3, "4"]
])
def test_get_user_by_email_invalid_email(user_controller, email):
    with pytest.raises(ValueError, match='Error: invalid email address'):
        user_controller.get_user_by_email(email)

# Test case for when theres no used returned from database method call - should return None
def test_get_user_by_email_no_user(user_controller):
    user_controller.dao.find.return_value = []
    result = user_controller.get_user_by_email('test@test.com')
    assert result is None

# Test case for when the database method throws an exception - should raise the same exception
def test_get_user_by_email_database_throw(user_controller):
    user_controller.dao.find.side_effect = Exception("Database error")
    with pytest.raises(Exception, match='Database error'):
        user_controller.get_user_by_email('test@test.com')

# Test case for when there are multiple users with the same email - should print an error message and return the email
def test_get_user_by_email_two_user_same_email_prints_error(user_controller, capfd):
    user_controller.dao.find.return_value = [ {"email": 'test@test.com' }, {"email": 'test@test.com' } ]
    result = user_controller.get_user_by_email('test@test.com')
    out, err = capfd.readouterr()
    assert "test@test.com" in out

def test_get_user_by_email_two_user_same_email_returns_user(user_controller, capfd):
    user_controller.dao.find.return_value = [ {"email": 'test@test.com' }, {"email": 'test@test.com' } ]
    result = user_controller.get_user_by_email('test@test.com')
    out, err = capfd.readouterr()
    assert result == {"email": 'test@test.com' }

# Test case for one email that is included in database
def test_get_user_by_email_valid_user_email(user_controller):
    user_controller.dao.find.return_value = [ {"email": 'test@test.com' } ]
    result = user_controller.get_user_by_email('test@test.com')
    assert result == {"email": 'test@test.com' }
