import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { problems } from '@/utils'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/problems',
      name: 'problems',
      component: () => import('@/views/ProblemsView.vue'),
      props: (route) => ({
        page: route.query.page ? parseInt(route.query.page.toString()) : 1,
        chapter: route.query.chapter ? parseInt(route.query.chapter.toString()) : null,
      }),
      meta: { title: 'Problems' },
    },
    {
      path: '/problems/:id([a-z0-9]{6})',
      name: 'problem',
      component: () => import('@/views/ProblemView.vue'),
      props: (route) => ({
        id: route.params.id,
        problem: problems[route.params.id.toString()],
      }),
    },
    {
      path: '/formulae',
      name: 'formulae',
      component: () => import('@/views/FormulaeView.vue'),
      meta: { title: 'Formulae' },
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('@/views/ContactView.vue'),
      meta: { title: 'Contact' },
    },
    {
      path: '/:catchAll(.*)*',
      name: 'notFound',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Not Found' },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to, from, next) => {
  if (to.name === 'problem' && !(to.params.id.toString() in problems)) {
    next({ name: 'notFound' })
  }

  next()
})

router.afterEach((to) => {
  nextTick(() => {
    let title: string = 'Logic Problems'
    if (to.meta.title) {
      title = `${to.meta.title} | ${title}`
    } else if (to.name === 'problem' && to.params.id.toString() in problems) {
      title = `${problems[to.params.id.toString()].title} | ${title}`
    }
    document.title = title
  })
})

export default router
