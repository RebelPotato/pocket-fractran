let vm = null;
let runner = null;
let currentState = null;
let isRunning = false;
const elId = (id) => document.getElementById(id);

function updateLog(message) {
  const log = elId("log");
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.textContent = message;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function clearLog() {
  elId("log").innerHTML = "";
}

function updateState(state) {
  currentState = state;
  try {
    updateLog("-------------------");
    updateLog(`Applied: ${state.frac.toString()} (${toBig(state.frac.rhs)} / ${toBig(state.frac.lhs)})`);
    updateLog(`State: ${vm.toWords(state.acc)} (${toBig(state.acc)})`);
  } catch (e) {
    updateLog(`Error: ${e.message}`);
    stopExecution();
    throw e;
  }
}

function stopExecution() {
  isRunning = false;
  elId("run").textContent = "START";
}

function initRunner() {
  const initial = elId("initial").value;
  currentState = { acc: vm.toList(initial) };
  updateLog(`Mappings: ${vm.words.map((w, i) => `${w} -> ${primes[i]}`).join(", ")}`);
  updateLog(`Initial state: ${vm.toWords(currentState.acc)} (${toBig(currentState.acc)})`);
  runner = vm.run(currentState.acc);
}

function* execute() {
  try {
    initRunner();
    while (true) {
      const { value, done } = runner.next();
      if (done) break;
      yield value;
    }
  } catch (e) {
    updateLog(`Error: ${e.message}`);
    stopExecution();
    throw e;
  }
}

elId("run").addEventListener("click", () => {
  if (!isRunning) {
    try {
      clearLog();
      vm = compile(elId("code").value);
      const gen = execute();

      isRunning = true;
      elId("run").textContent = "STOP";

      function runStep() {
        const { value, done } = gen.next();
        if (value) updateState(value);
        if (done || !isRunning) {
          stopExecution();
          if (done) updateLog("Execution completed");
        } else {
          setTimeout(runStep, 500);
        }
      }

      runStep();
    } catch (e) {
      updateLog(`Compilation error: ${e.message}`);
      stopExecution();
      throw e;
    }
  } else {
    stopExecution();
  }
});

elId("step").addEventListener("click", () => {
  if(isRunning) {
    isRunning = false;
    return;
  }
  try {
    if (!vm) {
      vm = compile(elId("code").value);
      currentState = null;
    }
    if (!runner) initRunner();

    const { value, done } = runner.next();
    if (value) updateState(value);
    if (done) {
      updateLog("Execution complete");
      runner = null;
    }
  } catch (e) {
    updateLog(`Error: ${e.message}`);
    runner = null;
    throw e;
  }
});

elId("reset").addEventListener("click", () => {
  stopExecution();
  vm = null;
  runner = null;
  currentState = null;
  clearLog();
});

// Initialize with example code
elId("code").value = `z i => x i
i =>
x y => y z res
y => i
x =>`;
elId("initial").value = "x^4 y^3";
