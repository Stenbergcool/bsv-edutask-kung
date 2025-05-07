describe('Manipulate todo-list', () => {
    // define variables that we need on multiple occasions
    let uid // user id
    let email // email of the user
    let taskid // id of the task
    let todoidFalse // id of the todo
    let todoidTrue // id of the todo
  
    before(function () {
      // create a fabricated user with a task
        cy.fixture('user.json')
            .then((user) => {
                cy.request({
                    method: 'POST',
                    url: 'http://localhost:5000/users/create',
                    form: true,
                    body: user
                }).then((response) => {
                    uid = response.body._id.$oid
                    email = user.email
                })
            })
    })

    before(function () {
        cy.fixture('task.json')
            .then((task) => {
                task.userid = uid;
                task.todos = "Watch video";
                cy.request({
                    method: 'POST',
                    url: 'http://localhost:5000/tasks/create',
                    form: true,
                    body: task
                }).then((response) => {
                    taskid = response.body[0]._id.$oid
                })
            });
    })

    beforeEach(function () {
        cy.fixture('todo.json')
        .then((todo) => {
            todo.taskid = taskid;
            cy.request({
                method: 'POST',
                url: 'http://localhost:5000/todos/create',
                form: true,
                body: todo
            }).then((response) => {
                todoidFalse = response.body._id.$oid
                cy.fixture('todo-struck-through.json')
                .then((todo) => {
                    todo.taskid = taskid;
                    cy.request({
                        method: 'POST',
                        url: 'http://localhost:5000/todos/create',
                        form: true,
                        body: todo
                    }).then((response) => {
                        todoidTrue = response.body._id.$oid

                        cy.visit('http://localhost:3000');

                        cy.contains('div', 'Email Address')
                            .find('input[type=text]')
                            .type(email);
                        
                        cy.get('form').submit();
                        cy.contains('div', 'Improve Devtools').click();
                    })
                })
            })
        })
    });
    // .then(() => {
    //     cy.visit('http://localhost:3000');

    //     cy.contains('div', 'Email Address')
    //         .find('input[type=text]')
    //         .type(email);
        
    //     cy.get('form').submit();
    //     cy.contains('div', 'Improve Devtools').click();
    // })
    it('new todo item is created and appended', () => {
        cy.contains('div', 'Evaluate usability of tools')
        .find('input[type=text]')
        .scrollIntoView()
        .should('be.visible')
        .type("New thing to do!");

        cy.contains('div', 'Evaluate usability of tools')
        .find('input[type=submit]').click();

        cy.contains('div', 'Evaluate usability of tools')
        .find('li').not(':has(form)').last()
        .should('contain', 'New thing to do!');
    })

    it('"Add" when description field does not contain text', () => {
        cy.contains('div', 'Evaluate usability of tools')
        .within(() => {
            // cy.contains('Evaluate usability of tools');
            cy.get('input[type=text]').should('have.value', '');
            cy.get('input[type=submit]').should('be.disabled');
        })
    })

    it('todo item is set to done and struck through', () => {
        cy.contains('span', 'Evaluate usability of tools')
        .prev('span').click()

        cy.contains('span', 'Evaluate usability of tools')
        .should('have.css', 'text-decoration-line', 'line-through');

        cy.request({
            method: 'GET',
            url: `http://localhost:5000/todos/byid/${todoidTrue}`
        }).then((response) => {
            expect(response.body.done).to.be.true;
        });
    })

    it('todo item is set to active and not struck through', () => {
        cy.contains('span', 'Born to be struck through')
            .prev('span').click()

        cy.contains('span', 'Born to be struck through')
            .should('not.have.css', 'text-decoration-line', 'line-through');

            cy.request({
                method: 'GET',
                url: `http://localhost:5000/todos/byid/${todoidFalse}`
            }).then((response) => {
                expect(response.body.done).to.not.be.true;
            });
    })

    it('remove todo item from todo list', () => {
        cy.contains('li', 'Evaluate usability of tools')
            .contains('✖').click();

        cy.get('li').should('not.contain', 'Evaluate usability of tools');
    })

    afterEach(function () {
        cy.request({
            method: 'DELETE',
            url: `http://localhost:5000/todos/byid/${todoidFalse}`,
            failOnStatusCode: false
        }).then((response) => {
            cy.log(response.body)
        });
        cy.request({
            method: 'DELETE',
            url: `http://localhost:5000/todos/byid/${todoidTrue}`,
            failOnStatusCode: false
        }).then((response) => {
            cy.log(response.body)
        });
    });

    after(function () {
        // clean up by deleting the user and task from the database
        cy.request({
            method: 'DELETE',
            url: `http://localhost:5000/tasks/byid/${taskid}`
        }).then((taskResponse) => {
            cy.log(taskResponse.body)

            cy.request({
                method: 'DELETE',
                url: `http://localhost:5000/users/${uid}`,
            }).then((response) => {
                cy.log(response.body)
            });
        });
    });
})