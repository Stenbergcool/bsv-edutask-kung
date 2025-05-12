describe('Manipulate todo-list', () => {
    before(function () {
        // start by cleaning up potential prior test users
        cy.deleteTestUsers().then(() => {
            cy.createUser().as('user').then((user) => {
                cy.createTask(user.uid).as('task').then(() => {
                    Cypress.env('email', user.email);
                    Cypress.env('taskid', this.task.taskid);
                })
            })
        });
    })

    beforeEach(function () {
        const email = Cypress.env('email')
        const taskid = Cypress.env('taskid')
        cy.then(() => {
            cy.createTodo('todo.json', taskid).as('todoidFalse')
            cy.createTodo('todo-struck-through.json', taskid).as('todoidTrue')
            .then(() => {
                cy.login(email)
            })
        });
    });

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
            cy.get('input[type=text]').should('have.value', '');
            cy.get('input[type=submit]').should('be.disabled');
        })
    })

    it('todo item is set to done and struck through', () => {
        cy.contains('span', 'Evaluate usability of tools')
        .prev('span').click();

        cy.contains('span', 'Evaluate usability of tools')
        .should('have.css', 'text-decoration-line', 'line-through');

        cy.get('@todoidTrue').then(({ todoid }) => {
            cy.request({
                method: 'GET',
                url: `http://localhost:5000/todos/byid/${todoid}`
            }).then((response) => {
                expect(response.body.done).to.be.true;
            });
        });
    })

    it('todo item is set to active and not struck through', () => {
        cy.contains('span', 'Born to be struck through')
            .prev('span').click()

        cy.contains('span', 'Born to be struck through')
            .should('not.have.css', 'text-decoration-line', 'line-through');

        cy.get('@todoidFalse').then(({ todoid }) => {
            cy.request({
                method: 'GET',
                url: `http://localhost:5000/todos/byid/${todoid}`
            }).then((response) => {
                expect(response.body.done).to.not.be.true;
            })
        });
    })

    it('remove todo item from todo list', () => {
        cy.contains('li', 'Evaluate usability of tools')
            .contains('✖').click();

        cy.get('li').should('not.contain', 'Evaluate usability of tools');
    })

    afterEach(function () {
        cy.get('@todoidFalse').then(({ todoid }) => {
            cy.request({
                method: 'DELETE',
                url: `http://localhost:5000/todos/byid/${todoid}`,
                failOnStatusCode: false
            }).then((response) => {
                cy.log(response.body)
            })
        });

        cy.get('@todoidTrue').then(({ todoid }) => {
            cy.request({
                method: 'DELETE',
                url: `http://localhost:5000/todos/byid/${todoid}`,
                failOnStatusCode: false
            }).then((response) => {
                cy.log(response.body)
            })
        });
    });

    after(function () {
        // clean up by deleting the user and task from the database
        cy.deleteTestUsers()
    });
})
