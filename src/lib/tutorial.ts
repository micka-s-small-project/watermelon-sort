const KEY = "watermelon-sorter-tutorial-completed-v1";

export function hasCompletedTutorial(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "true";
  } catch {
    return false;
  }
}

export function completeTutorial(): void {
  try {
    window.localStorage.setItem(KEY, "true");
  } catch {
    // The game remains playable when browser storage is unavailable.
  }
}
