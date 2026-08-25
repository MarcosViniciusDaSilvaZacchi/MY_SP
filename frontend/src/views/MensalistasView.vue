<template>
  <div>
    <h1>&#128100; Mensalistas</h1>
    <div class="placeholder-table">
      <p>Tabela de mensalistas sera carregada aqui.</p>
      <p class="tip">Chamara GET /api/mensalistas</p>
    </div>
  </div>
</template>

<script setup>
// TODO: implementar logica e chamadas de API
</script>

<style scoped>
h1 { color: #1e293b; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; }

/* Dashboard cards */
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
.card { background: #fff; border-radius: 10px; padding: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.card-label { margin: 0 0 0.4rem; font-size: 0.82rem; color: #64748b; }
.card-value { margin: 0; font-size: 2rem; font-weight: 700; }
.card-blue  { color: #0284c7; }
.card-green { color: #16a34a; }

/* Placeholder form */
.placeholder-form {
  background: #fff;
  border-radius: 10px;
  padding: 1.5rem;
  max-width: 400px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.placeholder-form label { font-size: 0.85rem; font-weight: 600; color: #374151; }
.placeholder-form input {
  padding: 0.6rem 0.8rem;
  border: 1.5px solid #d1d5db;
  border-radius: 7px;
  font-size: 0.95rem;
}
.placeholder-form button {
  padding: 0.65rem;
  background: #0284c7;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}
.placeholder-form button:hover { background: #0369a1; }

/* Placeholder table */
.placeholder-table {
  background: #fff;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  color: #64748b;
}

.tip { font-size: 0.78rem; color: #94a3b8; font-style: italic; margin: 0.5rem 0 0; }
</style>
