import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './pages/HomeView.vue'
import PresetDetailView from './pages/PresetDetailView.vue'
import PresetEditView from './pages/PresetEditView.vue'
import TimerView from './pages/TimerView.vue'
import SummaryView from './pages/SummaryView.vue'
import { useWorkout } from './composables/useWorkout.js'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/preset/:type/:key', name: 'preset-detail', component: PresetDetailView },
    { path: '/edit/:key', name: 'preset-edit', component: PresetEditView },
    { path: '/new', name: 'preset-new', component: PresetEditView },
    { path: '/train', name: 'train', component: TimerView },
    { path: '/summary', name: 'summary', component: SummaryView },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

// 训练/总结是运行时页面：没有进行中的训练时不允许直接进入
const workout = useWorkout()
router.beforeEach((to) => {
  if (to.path === '/train' && workout.view.value !== 'timer') return '/'
  if (to.path === '/summary' && workout.view.value !== 'summary') return '/'
})

export default router
