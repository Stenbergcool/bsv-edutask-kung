Cypress.Commands.add('login', (email) => {
    cy.visit('http://localhost:3000');

    cy.contains('div', 'Email Address')
        .find('input[type=text]')
        .type(email);
    
    cy.get('form').submit();
    cy.contains('div', 'Improve Devtools').click();
});

Cypress.Commands.add('createUser', () => {
    return cy.fixture('user.json')
    .then((user) => {
        return cy.request({
            method: 'POST',
            url: 'http://localhost:5000/users/create',
            form: true,
            body: user
        }).then((response) => {
            const uid = response.body._id.$oid;
            const email = user.email;
            return cy.wrap({ uid, email });
        });
    });
});

Cypress.Commands.add('deleteTestUsers', () => {
    cy.fixture('user.json')
    .then((user) => {
        deleteUsersByEmail(user.email);
    });
});

/**
 * Helper function in cypress command 'deleteUsersByEmail'.
 * Allows for recursion.
 * @param {string} email The test email to clean from database.
 */
function deleteUsersByEmail(email) {
    cy.request({
        method: 'GET',
        url: `http://localhost:5000/users/bymail/${email}`,
        failOnStatusCode: false
    }).then((response) => {
        if (response.status !== 200 || !response.body || !response.body._id) {
            cy.log(`No users left with email: ${email}`);
            return;
        }
        const uid = response.body._id.$oid;
        cy.request({
            method: 'DELETE',
            url: `http://localhost:5000/users/${uid}`,
            failOnStatusCode: false
        }).then(() => {
            cy.log(`Deleted user: ${uid}`);
            deleteUsersByEmail(email);
        })
    });
}
