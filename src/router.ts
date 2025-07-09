import { createRouter, createWebHistory } from 'vue-router'
import {nextTick} from 'vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./views/HomeView.vue'),
    },
    {
      path: '/problems',
      name: 'problems',
      component: () => import('./views/ProblemsView.vue'),
      meta: {title: 'Problems'},
    },
    {
      path: '/problems/:id',
      name: 'problem',
      component: () => import('./views/ProblemView.vue'),
      props: true,
    },
    {
      path: '/formulae',
      name: 'formulae',
      component: () => import('./views/FormulaeView.vue'),
      meta: {title: 'Formulae'},
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('./views/ContactView.vue'),
      meta: {title: 'Contact'},
    },
    {
      path: '/terms',
      name: 'terms',
      component: () => import('./views/TermsView.vue'),
      meta: {title: 'Terms'},
    },
  ],
  scrollBehavior() {
    // always scroll to top
    return { top: 0 };
  },
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
