describe('Marketplace Page', () => {
  beforeEach(() => {
    // Mock the products API response
    cy.intercept('GET', '**/products*', {
      statusCode: 200,
      body: {
        status: "SUCCESS",
        data: {
          content: [
            {
              productId: 1,
              productName: 'Mocked Software A',
              basePrice: 49.99,
              description: 'A great mocked software product for testing.',
              createdAt: '2023-01-01T10:00:00Z',
              categoryName: 'Testing',
              tags: ['mock', 'e2e'],
              averageRating: 5.0,
              reviewCount: 10,
              soldCount: 100
            },
            {
              productId: 2,
              productName: 'Mocked Software B',
              basePrice: 199.00,
              description: 'Another mocked software.',
              createdAt: '2023-02-01T10:00:00Z',
              categoryName: 'Testing',
              tags: ['mock', 'tool'],
              averageRating: 4.5,
              reviewCount: 5,
              soldCount: 50
            }
          ],
          totalElements: 2,
          totalPages: 1,
          size: 10,
          number: 0
        }
      }
    }).as('getProducts');
  });

  it('should display the software list correctly using mock data when backend is unavailable', () => {
    cy.visit('/marketplace');
    cy.wait('@getProducts');
    cy.contains('.marketplace__title', 'Software Marketplace').should('be.visible');
    
    // Check that the grid exists
    cy.get('.product-grid__cards').should('exist');
    
    // Check mocked items
    cy.contains('Mocked Software A').should('be.visible');
    cy.contains('Mocked Software B').should('be.visible');
  });
});
