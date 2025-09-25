# React App - README

## Introduction

This README outlines the structure and development patterns for our client-side React application.
It's designed to provide clarity on the app's architecture and best practices adopted in this
project.

## Directory Structure

Our React application is organized into several key directories, each serving a distinct purpose:

1. **components**: This directory contains all reusable or sub-components used in the application.
   Components should be modular and designed for reuse across different parts of the application.

2. **hooks**: This directory is dedicated to React hooks, which are used for state and effect
   management. Hooks encapsulate most of the business logic, allowing components to remain clean and
   focused on the UI.

3. **store**: It houses the global state management logic, typically using Redux. This is where we
   manage the application-wide state and handle asynchronous operations like HTTP requests.

4. **utils**: Utility functions that are used across the application are stored here. These
   functions are usually helper functions or shared logic that doesn't fit into components or hooks.

5. **views**: This directory contains the main React pages or views. Each view represents a distinct
   part of the application UI and is composed of components from the `components` directory.

## Development Patterns

### State and Effect Management

- We heavily utilize React hooks for all state and effect management. This approach helps in keeping
  the component logic simple and concise.
- Business logic is primarily handled within hooks, separating it from the UI logic in components.

### HTTP Requests

- HTTP requests and API interactions are either managed through global state (using Redux) or within
  React hooks. This centralizes data fetching and state management, making it more maintainable.
- They should *always* use the `sendApiRequest` helper function

### Component Design

- Aim for simple, reusable components. This not only improves the maintainability of the code but
  also enhances its scalability.
- Components should be designed to be as stateless as possible, delegating state management to
  hooks.

### Best Practices

- Ensure code readability and maintainability by following established coding conventions and
  patterns.
- Regularly refactor and optimize the code to align with the evolving best practices in React
  development.