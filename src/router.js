import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './components/HomeView.vue'
import PresetDetailView from './components/PresetDetailView.vue'
import PresetEditView from './components/PresetEditView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/preset/:type/:key', name: 'preset-detail', component: PresetDetailView },
    { path: '/edit/:key', name: 'preset-edit', component: PresetEditView },
    { path: '/new', name: 'preset-new', component: PresetEditView },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

export default router
