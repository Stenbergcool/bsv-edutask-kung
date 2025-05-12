Cypress.Commands.add('createTodo', (fixtureName, taskid) => {
    return cy.fixture(fixtureName)
    .then((todo) => {
        todo.taskid = taskid;
        return cy.request({
            method: 'POST',
            url: 'http://localhost:5000/todos/create',
            form: true,
            body: todo
        }).then((response) => {
            const todoid = response.body._id.$oid;;
            return { todoid }
        });
    });
});