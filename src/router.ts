import { createRouter, createWebHistory } from 'vue-router'
import {nextTick} from 'vue';
import HomeView from './views/HomeView.vue'
import ProblemsView from './views/ProblemsView.vue'
import ProblemView from './views/ProblemView.vue'
import FormulaeView from './views/FormulaeView.vue'
import ContactView from './views/ContactView.vue'
import TermsView from './views/TermsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  linkActiveClass: 'active',
  linkExactActiveClass: 'active',
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/problems',
      name: 'problems',
      component: ProblemsView,
      meta: {title: 'Problems'},
    },
    {
      path: '/problems/:id',
      name: 'problem',
      component: ProblemView,
    },
    {
      path: '/formulae',
      name: 'formulae',
      component: FormulaeView,
      meta: {title: 'Formulae'},
    },
    {
      path: '/contact',
      name: 'contact',
      component: ContactView,
      meta: {title: 'Contact'},
    },
    {
      path: '/terms',
      name: 'terms',
      component: TermsView,
      meta: {title: 'Terms'},
    },
  ],
})

router.afterEach((to) => {
  nextTick(() => {
    const title: string = to.meta.title ?
      `${to.meta.title} | Logic Problems` :
      'Logic Problems';
    document.title = title;
  })
})

export default router
