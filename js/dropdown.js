'use strict';
// Кастомный выпадающий список (используется вместо <select>).

      function openDropdown(trigger, options, onSelect) {
        if (!trigger) return;
        if (activeTrigger === trigger) { closeDropdown(); return; }
        closeDropdown();

        const rect = trigger.getBoundingClientRect();
        const portal = document.createElement('div');
        portal.className = 'dropdown-portal';
        portal.style.top = (rect.bottom + 6) + 'px';
        portal.style.left = rect.left + 'px';
        portal.style.width = Math.max(rect.width, 100) + 'px';
        portal.style.minWidth = '100px';

        options.forEach(opt => {
          const div = document.createElement('div');
          div.className = 'option';
          if (opt.selected) div.classList.add('selected');
          div.textContent = opt.label;
          div.dataset.value = opt.value;
          div.addEventListener('click', function(e) {
            e.stopPropagation();
            onSelect(opt.value, opt.label);
            closeDropdown();
          });
          portal.appendChild(div);
        });

        document.body.appendChild(portal);
        activeTrigger = trigger;
        const arrow = trigger.querySelector('.arrow');
        if (arrow) arrow.classList.add('open');

        function updatePosition() {
          const newRect = trigger.getBoundingClientRect();
          portal.style.top = (newRect.bottom + 6) + 'px';
          portal.style.left = newRect.left + 'px';
          portal.style.width = Math.max(newRect.width, 100) + 'px';
        }

        portal._updateHandler = updatePosition;
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        document.querySelectorAll('section').forEach(section => {
          section.addEventListener('scroll', updatePosition);
        });

        requestAnimationFrame(() => { portal.classList.add('open'); });

        const closeHandler = function(e) {
          if (!portal.contains(e.target) && !trigger.contains(e.target)) {
            closeDropdown();
            document.removeEventListener('click', closeHandler);
          }
        };
        setTimeout(() => { document.addEventListener('click', closeHandler); }, 10);
        portal._closeHandler = closeHandler;
      }

      function closeDropdown() {
        if (activeTrigger) {
          const portal = document.querySelector('.dropdown-portal.open');
          if (portal) {
            if (portal._updateHandler) {
              window.removeEventListener('scroll', portal._updateHandler, true);
              window.removeEventListener('resize', portal._updateHandler);
              document.querySelectorAll('section').forEach(section => {
                section.removeEventListener('scroll', portal._updateHandler);
              });
            }
            if (portal._closeHandler) {
              document.removeEventListener('click', portal._closeHandler);
            }
            portal.classList.remove('open');
            setTimeout(() => { if (portal.parentNode) portal.parentNode.removeChild(portal); }, 200);
          }
          const arrow = activeTrigger.querySelector('.arrow');
          if (arrow) arrow.classList.remove('open');
          activeTrigger = null;
        } else {
          const portal = document.querySelector('.dropdown-portal');
          if (portal) {
            portal.classList.remove('open');
            setTimeout(() => { if (portal.parentNode) portal.parentNode.removeChild(portal); }, 200);
          }
        }
      }
