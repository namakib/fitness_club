import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { NavModeProvider } from '../../context/NavModeContext';

export function renderWithProviders(ui, { route = '/', ...renderOpts } = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[route]}>
        <ThemeProvider>
          <NavModeProvider>
            {children}
          </NavModeProvider>
        </ThemeProvider>
      </MemoryRouter>
    ),
    ...renderOpts,
  });
}

export function renderWithRouter(ui, { route = '/' } = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[route]}>
        {children}
      </MemoryRouter>
    ),
  });
}

export function renderPlain(ui, opts) {
  return render(ui, opts);
}
