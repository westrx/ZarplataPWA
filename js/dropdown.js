// Кастомные выпадающие списки (рендерятся в портал поверх всего UI)

function initDropdown(triggerElement, hiddenInputId, options, onChangeCallback) {
  triggerElement.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeTrigger && activeTrigger !== triggerElement) closeDropdown(activeTrigger);
    activeTrigger = triggerElement;
    const hiddenInput = document.getElementById(hiddenInputId);
    const currentValue = hiddenInput.value;
    let dropdown = document.querySelector('.dropdown-portal');
    if (!dropdown) { dropdown = document.createElement('div'); dropdown.className = 'dropdown-portal'; document.body.appendChild(dropdown); }
    dropdown.innerHTML = '';
    options.forEach(opt => {
      const optionElement = document.createElement('div');
      optionElement.className = 'option' + (String(opt.value) === String(currentValue) ? ' selected' : '');
      optionElement.textContent = opt.label;
      optionElement.onclick = (ev) => {
        ev.stopPropagation();
        hiddenInput.value = opt.value;
        triggerElement.querySelector('.selected-value').textContent = opt.label;
        closeDropdown(triggerElement);
        if (onChangeCallback) onChangeCallback(opt);
      };
      dropdown.appendChild(optionElement);
    });
    const rect = triggerElement.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + window.scrollY + 4}px`;
    dropdown.style.left = `${rect.left + window.scrollX}px`;
    dropdown.style.minWidth = `${rect.width}px`;
    dropdown.classList.add('open');
    triggerElement.querySelector('.arrow').classList.add('open');
  });
}

function closeDropdown(trigger) {
  if (!trigger) { const dp = document.querySelector('.dropdown-portal'); if (dp) dp.classList.remove('open'); return; }
  const dropdown = document.querySelector('.dropdown-portal');
  if (dropdown) dropdown.classList.remove('open');
  const arrow = trigger.querySelector('.arrow');
  if (arrow) arrow.classList.remove('open');
  activeTrigger = null;
}

document.addEventListener('click', (e) => {
  if (activeTrigger && !e.target.closest('.custom-select-trigger') && !e.target.closest('.dropdown-portal')) closeDropdown(activeTrigger);
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && activeTrigger) closeDropdown(activeTrigger); });

window.addEventListener('resize', () => { if (activeTrigger) closeDropdown(activeTrigger); });
window.addEventListener('scroll', () => { if (activeTrigger) closeDropdown(activeTrigger); }, true);
