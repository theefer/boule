describe('Sapper template app', () => {
    beforeEach(() => {
	cy.visit('/');
    });

    it('has the correct <h1>', () => {
	cy.contains('h1', 'Boule');
    });

    it('navigates to the first recipe', () => {
	cy.get('h2 a').contains('Pain de campagne').click();
        cy.url().should('include', '/recipes/pain-de-campagne');
	cy.contains('h2', 'Set the leaven');
    });
});
