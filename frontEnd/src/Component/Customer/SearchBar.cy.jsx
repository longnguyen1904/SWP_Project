import React from 'react'
import SearchBar from './SearchBar'

describe('<SearchBar />', () => {
  it('renders correctly and accepts input', () => {
    // 1. Dùng cy.mount để "gắn" (render) chỉ duy nhất component này độc lập
    // Thay vì cy.visit('/').
    
    // Giả lập một hàm onSearchSpy để theo dõi khi component gọi hàm này
    const onSearchSpy = cy.spy().as('onSearchSpy')
    
    cy.mount(<SearchBar onSearch={onSearchSpy} placeholder="Search for games..." />)

    // 2. Tương tác với component như user thật
    cy.get('.search-bar__input')
      .should('be.visible')
      .and('have.attr', 'placeholder', 'Search for games...')
      .type('Cyberpunk 2077')

    // 3. Giả lập bấm phím Enter
    cy.get('.search-bar__input').type('{enter}')

    // 4. Kiểm tra xem hàm onSearch có được gọi với đúng giá trị không
    cy.get('@onSearchSpy').should('have.been.calledWith', 'Cyberpunk 2077')
  })
})
