import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Contacto · Óptica Optimus' };

export default function ContactoPage() {
  return (
    <main className="container content">
      <h1 className="page-title">Contacto</h1>
      <p className="lede">Estamos para ayudarte a ver(te) mejor.</p>
      <div className="content__cards">
        <div className="card content__card">
          <h3>Escríbenos</h3>
          <p>
            <a href="mailto:hola@optimus.gt">hola@optimus.gt</a>
          </p>
          <p className="muted">Respondemos en menos de 24 h hábiles.</p>
        </div>
        <div className="card content__card">
          <h3>WhatsApp</h3>
          <p>
            <a href="https://wa.me/50200000000">+502 0000 0000</a>
          </p>
          <p className="muted">Lun–Sáb · 9:00–18:00</p>
        </div>
      </div>
    </main>
  );
}
