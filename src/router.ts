import { createRouter, createWebHistory } from 'vue-router'
import { decompressFromEncodedURIComponent } from 'lz-string'
import { problems } from '@/plugins/data'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: { name: 'problems' },
    },
    {
      path: '/problems',
      name: 'problems',
      component: () => import('@/views/ProblemsView.vue'),
      props: (route) => ({
        page: route.query.page ? parseInt(route.query.page.toString()) : 1,
        chapter: route.query.chapter ? parseInt(route.query.chapter.toString()) : null,
      }),
    },
    {
      path: '/problems/:id([a-z0-9]{6})',
      name: 'problem',
      component: () => import('@/views/ProblemView.vue'),
      props: (route) => ({
        id: route.params.id,
        problem: problems[route.params.id.toString()],
        lines: route.query.l
          ? JSON.parse(decompressFromEncodedURIComponent(route.query.l.toString()))
          : undefined,
      }),
    },
    {
      path: '/formulae',
      name: 'formulae',
      component: () => import('@/views/FormulaeView.vue'),
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('@/views/ContactView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/:catchAll(.*)*',
      name: 'notFound',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to, _, next) => {
  if (to.name === 'problem' && !(to.params.id.toString() in problems)) {
    next({ name: 'notFound' })
  }

  next()
})

export default router
