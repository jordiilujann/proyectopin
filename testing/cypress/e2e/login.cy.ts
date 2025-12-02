describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login page with Spotify button', () => {
    cy.contains('Record').should('be.visible');
    cy.contains('Descubre y comparte música').should('be.visible');
    cy.contains('Inicia sesión con Spotify').should('be.visible');
    cy.contains('Continuar con Spotify').should('be.visible');
  });

  it('should have clickable login button', () => {
    cy.contains('Continuar con Spotify').should('be.visible').and('not.be.disabled');
  });
});

