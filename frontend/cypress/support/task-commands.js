Cypress.Commands.add('createTask', (uid) => {
    return cy.fixture('task.json')
    .then((task) => {
        task.userid = uid;
        task.todos = "Watch video";
        return cy.request({
            method: 'POST',
            url: 'http://localhost:5000/tasks/create',
            form: true,
            body: task
        }).then((response) => {
            const taskid = response.body[0]._id.$oid
            return cy.wrap({ taskid });
        });
    });
});