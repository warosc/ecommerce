import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RastreoForm } from './RastreoForm';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('RastreoForm', () => {
  it('navega al pedido cuando se envía un número', () => {
    render(<RastreoForm />);
    fireEvent.change(screen.getByLabelText('Número de pedido'), {
      target: { value: '  abc-123  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Rastrear' }));
    expect(push).toHaveBeenCalledWith('/pedido/abc-123');
  });

  it('no navega si el campo está vacío', () => {
    push.mockClear();
    render(<RastreoForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Rastrear' }));
    expect(push).not.toHaveBeenCalled();
  });
});
