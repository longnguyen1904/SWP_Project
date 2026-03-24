// ***********************************************************
// This example support/component.js is processed and
// loaded automatically before your test files.
// ***********************************************************

import { mount } from 'cypress/react'

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
Cypress.Commands.add('mount', mount)
