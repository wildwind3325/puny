import { createRouter, createWebHashHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Home from '../views/Home.vue';
import NotFound from '../views/NotFound.vue';

const routes = [{
  path: '/',
  name: 'Login',
  component: Login
}, {
  path: '/home',
  name: 'Home',
  component: Home
}, {
  path: '/explorer',
  name: 'Explorer',
  component: () => import('../views/Explorer.vue')
}, {
  path: '/player',
  name: 'Player',
  component: () => import('../views/Player.vue')
}, {
  path: '/note/board',
  name: 'NoteBoard',
  component: () => import('../views/note/Board.vue')
}, {
  path: '/note/forum/:id',
  name: 'NoteForum',
  component: () => import('../views/note/Forum.vue'),
  meta: { keepAlive: true }
}, {
  path: '/note/post/:id',
  name: 'NotePost',
  component: () => import('../views/note/Post.vue')
}, {
  path: '/person',
  name: 'Person',
  component: () => import('../views/Person.vue')
}, {
  path: '/site',
  name: 'Site',
  component: () => import('../views/Site.vue')
}, {
  path: '/:pathMatch(.*)',
  name: 'NotFound',
  component: NotFound
}];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;