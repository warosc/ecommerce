import type { Metadata } from 'next';
import { RastreoForm } from '@/components/RastreoForm';

export const metadata: Metadata = { title: 'Rastrea tu pedido · Óptica Optimus' };

export default function RastreoPage() {
  return (
    <main className="container content">
      <h1 className="page-title">Rastrea tu pedido</h1>
      <p className="lede">
        Introduce el número de pedido que te dimos al finalizar la compra para ver su estado.
      </p>
      <RastreoForm />
      <p className="muted">
        ¿No lo encuentras? Escríbenos a <a href="mailto:hola@optimus.gt">hola@optimus.gt</a>.
      </p>
    </main>
  );
}
