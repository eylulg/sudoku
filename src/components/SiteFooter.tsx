import { defineComponent } from 'vue';

import { profileLinks, projectHref, projects } from '@eylulg/ui/projects';

import '@/styles/chrome.css';

const otherProjects = projects.filter((project) => project.id !== 'sudoku');

export default defineComponent({
  name: 'SiteFooter',
  setup() {
    return () => (
      <footer class='site-footer'>
        <nav aria-label='Other projects'>
          <ul>
            {otherProjects.map((project) => (
              <li key={project.id}>
                <a href={projectHref(project)}>{project.name}</a>
              </li>
            ))}
          </ul>
        </nav>
        <p>
          Built by Eylül Güneş. <a href={profileLinks.github}>GitHub</a>
          {' · '}
          <a href={profileLinks.linkedin}>LinkedIn</a>
        </p>
      </footer>
    );
  },
});
