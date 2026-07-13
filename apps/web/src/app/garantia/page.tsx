import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Garantía · Óptica Optimus' };

export default function GarantiaPage() {
  return (
    <main className="container content">
      <h1 className="page-title">Garantía</h1>
      <p className="lede">Todas nuestras monturas tienen 1 año de garantía.</p>
      <ul className="content__list">
        <li>
          <strong>Cobertura:</strong> defectos de fabricación en montura y bisagras.
        </li>
        <li>
          <strong>Vigencia:</strong> 12 meses desde la compra.
        </li>
        <li>
          <strong>No cubre:</strong> mal uso, ralladuras por desgaste o roturas por caídas.
        </li>
        <li>
          <strong>Cómo reclamar:</strong> contáctanos con tu número de pedido y una foto del
          defecto.
        </li>
      </ul>
    </main>
  );
}
