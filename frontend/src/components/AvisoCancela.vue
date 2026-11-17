<template>
  <!-- Só aparece quando há um ESP32 cadastrado: sem a maquete, as telas ficam como antes -->
  <div v-if="dispositivo" class="aviso-wrap">
    <div v-if="veiculoNaFaixa" class="aviso presenca">
      <span class="icone">🚗</span>
      <span>
        <strong>Veículo detectado no sensor de {{ rotuloFaixa }}.</strong>
        {{ sentido === 'ENTRADA'
          ? 'Registre a placa para abrir a cancela.'
          : 'Conclua a saída (com o pagamento) para abrir a cancela.' }}
      </span>
    </div>

    <div v-if="cancela" class="aviso" :class="cancela.acionada && cancela.dispositivoOnline ? 'ok' : 'alerta'">
      <span class="icone">{{ cancela.acionada && cancela.dispositivoOnline ? '✅' : '⚠️' }}</span>
      <span v-if="cancela.acionada && cancela.dispositivoOnline">
        <strong>Cancela acionada.</strong> O ESP32 recebeu a ordem de abrir para a {{ rotuloFaixa }}.
      </span>
      <span v-else-if="cancela.acionada">
        <strong>Comando enviado, mas o ESP32 está offline.</strong> Ele abre se reconectar em até 30 s; senão, abra manualmente.
      </span>
      <span v-else>
        <strong>A cancela não foi acionada</strong> (serviço de dispositivos indisponível). Abra manualmente.
      </span>
    </div>

    <span class="status" :class="{ on: dispositivo.online }">
      ESP32 {{ dispositivo.online ? 'online' : 'offline' }} · cancela {{ String(dispositivo.cancela || '').toLowerCase() }}
    </span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import api from '../services/api'

const props = defineProps({
  sentido: { type: String, required: true }, // 'ENTRADA' | 'SAIDA'
  cancela: { type: Object, default: null }, // retorno de /entradas ou /saidas
})

const dispositivo = ref(null)
let timer = null

const rotuloFaixa = computed(() => (props.sentido === 'ENTRADA' ? 'entrada' : 'saída'))
const veiculoNaFaixa = computed(() => !!dispositivo.value?.online && !!dispositivo.value?.veiculoAguardando?.[props.sentido])

async function atualizar() {
  try {
    const res = await api.get('/dispositivos')
    dispositivo.value = Array.isArray(res.data) && res.data.length ? res.data[0] : null
  } catch {
    dispositivo.value = null // serviço fora do ar: não mostra nada
  }
}

onMounted(() => {
  atualizar()
  timer = setInterval(atualizar, 1500)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.aviso-wrap { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
.aviso { display: flex; gap: 0.6rem; align-items: flex-start; padding: 0.7rem 0.9rem; border-radius: 8px; font-size: 0.86rem; line-height: 1.4; }
.aviso .icone { font-size: 1.05rem; line-height: 1.2; }
.presenca { background: #fffbeb; border: 1px solid #fcd34d; color: #78350f; animation: chamar 1.6s ease-in-out infinite; }
.ok { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
.alerta { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
.status { align-self: flex-end; font-size: 0.74rem; color: #b91c1c; font-weight: 600; }
.status.on { color: #15803d; }
@keyframes chamar { 50% { box-shadow: 0 0 0 4px rgba(252, 211, 77, 0.35); } }
</style>
