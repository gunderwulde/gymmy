const GROUP_NAMES = {
  chest: "Pecho",
  back: "Espalda",
  shoulders: "Hombros",
  arms: "Brazos",
  legs: "Piernas",
  glutes: "Glúteos",
  core: "Core",
  cardio: "Cardio"
};
const TYPE_NAMES = { machine: "Máquina", exercise: "Libre" };
const dateFormatter = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

function make(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function parseWeight(value) {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const weight = Number(normalized);
  return Number.isFinite(weight) && weight >= 0 ? weight : null;
}

function formatWeight(weight) {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(weight);
}

function formatLastDate(date) {
  return dateFormatter.format(new Date(date));
}

export function mountUI(catalog, loaded, { latestEntry, saveState }) {
  let state = loaded.state;
  let persistenceBlocked = Boolean(loaded.blocked);
  const list = document.querySelector("#exercise-list");
  const search = document.querySelector("#search-input");
  const empty = document.querySelector("#empty-state");
  const count = document.querySelector("#exercise-count");
  const message = document.querySelector("#app-message");
  const dialog = document.querySelector("#history-dialog");
  const historyContent = document.querySelector("#history-content");
  const historyFilter = document.querySelector("#history-filter");
  const filterButtons = [...document.querySelectorAll(".filter-button")];
  let currentType = "all";
  let dialogOpener = null;

  function announce(text, isError = false) {
    message.hidden = false;
    message.classList.toggle("is-error", isError);
    message.textContent = text;
    if (!isError) {
      window.clearTimeout(announce.timer);
      announce.timer = window.setTimeout(() => { message.hidden = true; }, 4200);
    }
  }

  function save(nextState) {
    if (persistenceBlocked) {
      announce("El almacenamiento está bloqueado porque los datos anteriores no pudieron respaldarse. No se ha guardado el cambio.", true);
      return false;
    }
    try {
      saveState(nextState);
      state = nextState;
      return true;
    } catch (error) {
      announce(`No se pudo guardar en este dispositivo: ${error.message}`, true);
      return false;
    }
  }

  function latestLine(exercise, target) {
    const last = latestEntry(state.history, exercise.id);
    target.classList.toggle("no-session", !last);
    target.textContent = last
      ? `Última vez: ${formatLastDate(last.date)} · ${formatWeight(last.weight)} kg × ${last.reps}`
      : "Aún no has registrado este ejercicio";
  }

  function createCard(exercise) {
    const card = make("article", "exercise-card");
    card.dataset.exerciseId = exercise.id;
    const image = make("img", "exercise-image");
    image.src = `./${exercise.image}`;
    image.alt = `${exercise.name}, ilustración`;
    image.width = 82;
    image.height = 82;
    image.loading = "lazy";
    image.addEventListener("error", () => {
      if (!image.src.endsWith("/assets/icons/image-placeholder.svg")) {
        image.src = "./assets/icons/image-placeholder.svg";
      }
    }, { once: true });
    card.append(image);

    const info = make("div", "exercise-info");
    const titleRow = make("div", "exercise-title-row");
    titleRow.append(make("h3", "exercise-name", exercise.name));
    const typeBadge = make("span", `type-pill${exercise.type === "exercise" ? " is-free" : ""}`, TYPE_NAMES[exercise.type]);
    titleRow.append(typeBadge);
    info.append(titleRow, make("span", "muscle-label", GROUP_NAMES[exercise.muscleGroup]));

    const last = make("p", "last-session");
    latestLine(exercise, last);
    info.append(last);

    const controls = make("div", "entry-controls");
    const saved = state.values[exercise.id];
    const previous = latestEntry(state.history, exercise.id);
    const startingWeight = saved?.weight ?? previous?.weight ?? exercise.defaultWeight;
    const startingReps = saved?.reps ?? previous?.reps ?? exercise.defaultReps;
    const weight = make("input", "field-input");
    const reps = make("input", "field-input");
    const weightId = `weight-${exercise.id}`;
    const repsId = `reps-${exercise.id}`;
    const weightErrorId = `${weightId}-error`;
    const repsErrorId = `${repsId}-error`;
    weight.id = weightId;
    weight.type = "text";
    weight.inputMode = "decimal";
    weight.autocomplete = "off";
    weight.value = String(startingWeight);
    weight.setAttribute("aria-describedby", weightErrorId);
    reps.id = repsId;
    reps.type = "text";
    reps.inputMode = "numeric";
    reps.autocomplete = "off";
    reps.value = String(startingReps);
    reps.setAttribute("aria-describedby", repsErrorId);

    function labelledField(labelText, input, errorId) {
      const label = make("label", "field-label", labelText);
      label.htmlFor = input.id;
      const error = make("span", "field-error");
      error.id = errorId;
      label.append(input, error);
      return { label, error };
    }
    const weightField = labelledField("Peso (kg)", weight, weightErrorId);
    const repsField = labelledField("Repeticiones", reps, repsErrorId);
    const done = make("button", "done-button");
    done.type = "button";
    done.setAttribute("aria-label", `Registrar ${exercise.name} como hecho`);
    const check = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    check.setAttribute("viewBox", "0 0 24 24");
    check.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "m5 12 4.5 4.5L19 7");
    check.append(path);
    done.append(check, document.createTextNode("Hecho"));
    controls.append(weightField.label, repsField.label, done);
    info.append(controls);
    card.append(info);

    const showFieldError = (input, error, text) => {
      input.setAttribute("aria-invalid", text ? "true" : "false");
      error.textContent = text;
    };
    const saveEditedValues = () => {
      const parsedWeight = parseWeight(weight.value);
      const parsedReps = /^\d+$/.test(reps.value.trim()) ? Number(reps.value.trim()) : null;
      if (parsedWeight === null || parsedReps === null || parsedReps < 1) return;
      save({
        ...state,
        values: { ...state.values, [exercise.id]: { weight: parsedWeight, reps: parsedReps } }
      });
    };
    weight.addEventListener("input", () => {
      showFieldError(weight, weightField.error, parseWeight(weight.value) === null ? "Usa un peso válido (ej.: 12,5)." : "");
    });
    reps.addEventListener("input", () => {
      const parsed = /^\d+$/.test(reps.value.trim()) ? Number(reps.value.trim()) : 0;
      showFieldError(reps, repsField.error, parsed < 1 ? "Indica al menos 1 repetición." : "");
    });
    weight.addEventListener("change", saveEditedValues);
    reps.addEventListener("change", saveEditedValues);

    done.addEventListener("click", () => {
      const parsedWeight = parseWeight(weight.value);
      const parsedReps = /^\d+$/.test(reps.value.trim()) ? Number(reps.value.trim()) : null;
      showFieldError(weight, weightField.error, parsedWeight === null ? "Usa un peso válido (ej.: 12,5)." : "");
      showFieldError(reps, repsField.error, parsedReps === null || parsedReps < 1 ? "Indica al menos 1 repetición." : "");
      if (parsedWeight === null || parsedReps === null || parsedReps < 1) {
        announce("Revisa el peso y las repeticiones antes de registrar la serie.", true);
        (parsedWeight === null ? weight : reps).focus();
        return;
      }
      const entry = { exerciseId: exercise.id, weight: parsedWeight, reps: parsedReps, date: new Date().toISOString() };
      const nextState = {
        ...state,
        values: { ...state.values, [exercise.id]: { weight: parsedWeight, reps: parsedReps } },
        history: [...state.history, entry]
      };
      if (save(nextState)) {
        latestLine(exercise, last);
        announce(`${exercise.name}: ${formatWeight(parsedWeight)} kg × ${parsedReps} registrado.`);
      }
    });
    return card;
  }

  function renderExercises() {
    const query = search.value.trim().toLocaleLowerCase("es");
    const visible = catalog.filter((exercise) =>
      (currentType === "all" || exercise.type === currentType) &&
      `${exercise.name} ${GROUP_NAMES[exercise.muscleGroup]}`.toLocaleLowerCase("es").includes(query)
    );
    list.replaceChildren(...visible.map(createCard));
    count.textContent = String(visible.length);
    empty.hidden = visible.length !== 0;
  }

  function updateHistoryFilter() {
    const current = historyFilter.value;
    const options = [new Option("Todos los ejercicios", "all")];
    for (const exercise of catalog) options.push(new Option(exercise.name, exercise.id));
    historyFilter.replaceChildren(...options);
    if (options.some((option) => option.value === current)) historyFilter.value = current;
  }

  function renderHistory() {
    const selected = historyFilter.value;
    const names = new Map(catalog.map((exercise) => [exercise.id, exercise.name]));
    const entries = state.history
      .filter((entry) => selected === "all" || entry.exerciseId === selected)
      .slice()
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    if (!entries.length) {
      const emptyHistory = make("p", "history-empty",
        state.history.length ? "Todavía no hay registros para este ejercicio." : "Aún no hay entrenamientos guardados. Pulsa «Hecho» en un ejercicio para empezar a seguir tu progreso.");
      historyContent.replaceChildren(emptyHistory);
      return;
    }
    const groups = new Map();
    for (const entry of entries) {
      const date = new Date(entry.date);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!groups.has(key)) groups.set(key, { date, entries: [] });
      groups.get(key).entries.push(entry);
    }
    const fragment = document.createDocumentFragment();
    for (const group of groups.values()) {
      fragment.append(make("h3", "history-day", new Intl.DateTimeFormat("es-ES", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      }).format(group.date)));
      for (const entry of group.entries) {
        const row = make("div", "history-entry");
        const description = make("div");
        description.append(make("span", "history-exercise", names.get(entry.exerciseId) ?? "Ejercicio eliminado"));
        description.append(make("span", "history-time", new Intl.DateTimeFormat("es-ES", {
          hour: "2-digit", minute: "2-digit"
        }).format(new Date(entry.date))));
        row.append(description, make("span", "history-result", `${formatWeight(entry.weight)} kg × ${entry.reps}`));
        fragment.append(row);
      }
    }
    historyContent.replaceChildren(fragment);
  }

  search.addEventListener("input", renderExercises);
  for (const button of filterButtons) {
    button.addEventListener("click", () => {
      currentType = button.dataset.filter;
      for (const item of filterButtons) {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      }
      renderExercises();
    });
  }
  document.querySelector("#history-button").addEventListener("click", (event) => {
    dialogOpener = event.currentTarget;
    updateHistoryFilter();
    renderHistory();
    dialog.showModal();
  });
  document.querySelector("#close-history").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    const opener = dialogOpener;
    dialogOpener = null;
    window.setTimeout(() => opener?.focus(), 0);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  historyFilter.addEventListener("change", renderHistory);

  if (loaded.warning) announce(loaded.warning, true);
  renderExercises();
}
