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
	cy.contains('.description', 'The pain de campagne, or “country bread” in French, is a rustic sourdough with a touch of rye and whole wheat.');
    });
});
