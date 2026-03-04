// dice-roll-web.js — Web implementation of /dice-roll for twinstones.link
// Mirrors dice-roll.js Discord command logic.

const ALLOWED_DICE = [2, 4, 6, 8, 10, 12, 20, 100];

function diceRoll({ diceString = '1d20', bonus = 'none', modifier = 0 } = {}) {
    diceString = diceString.trim().toLowerCase();

    const isCoin = diceString === 'coin';
    if (isCoin) diceString = '1d2';

    const parts = diceString.split('d').map(Number);
    let numDice = parts[0];
    const numSides = parts[1];

    if (!Number.isInteger(numDice) || !Number.isInteger(numSides) || numSides <= 0) {
        return { error: 'Invalid dice format. Use XdY (e.g. 3d6) or "coin".' };
    }
    if (!ALLOWED_DICE.includes(numSides)) {
        return { error: `Invalid dice size. Allowed: ${ALLOWED_DICE.map(d => 'd' + d).join(', ')}, coin.` };
    }
    if (numDice > 1 && numSides === 20 && bonus !== 'none') {
        return { error: 'Cannot use advantage/disadvantage with multiple d20s.' };
    }
    if (numDice <= 0) numDice = 1;

    let rolls = Array.from({ length: numDice }, () => rollDie(numSides));
    let total = rolls.reduce((a, b) => a + b, 0) + modifier;

    let secondRoll = null;
    let finalResult = total;
    let title = `Roll Result for ${isCoin ? 'coin' : diceString}`;
    let outcome = 'neutral';
    let color = DH_COLOURS.neutral;
    let flavour = '';

    if (numSides === 20 && numDice === 1 && bonus !== 'none') {
        secondRoll = rollDie(20);
        finalResult = bonus === 'advantage'
            ? Math.max(rolls[0], secondRoll) + modifier
            : Math.min(rolls[0], secondRoll) + modifier;
        title = `Roll Result for d20 (with ${bonus === 'advantage' ? 'Advantage' : 'Disadvantage'})`;
    } else if (numSides === 20 && numDice === 1) {
        finalResult = rolls[0] + modifier;
    }

    const rawD20 = numSides === 20 && numDice === 1
        ? (secondRoll !== null ? (bonus === 'advantage' ? Math.max(rolls[0], secondRoll) : Math.min(rolls[0], secondRoll)) : rolls[0])
        : null;

    if (rawD20 === 20) {
        title = 'Critical Success!';
        outcome = 'hope';
        color = DH_COLOURS.hope;
        flavour = '<img src="images/hope.png" alt="Critical Success" width="32" height="32"> Natural f*ing 20!';
    } else if (rawD20 === 1) {
        title = 'Critical Fail!';
        outcome = 'fear';
        color = DH_COLOURS.fear;
        flavour = '<img src="images/fear.png" alt="Critical Fail" width="32" height="32"> Natural One...';
    }

    return { isCoin, numDice, numSides, rolls, secondRoll, bonus, modifier, finalResult, title, outcome, color, flavour };
}

function buildDiceModalInputs() {
    return `
        <div class="row g-2 align-items-end">
            <div class="col-12">
                <label class="form-label form-label-sm mb-1">Dice</label>
                <input type="text" class="form-control form-control-sm" id="try-dice" value="1d20" placeholder="e.g. 3d6, coin">
                <div id="dice-feedback" class="small mt-1"></div>
            </div>
            <div class="col-6">
                <label class="form-label form-label-sm mb-1">Bonus (d20 only)</label>
                <select class="form-select form-select-sm" id="try-bonus">
                    <option value="none">None</option>
                    <option value="advantage">Advantage</option>
                    <option value="disadvantage">Disadvantage</option>
                </select>
            </div>
            <div class="col-6">
                <label class="form-label form-label-sm mb-1">Modifier</label>
                <input type="number" class="form-control form-control-sm" id="try-modifier" value="0">
            </div>
        </div>
                        <div class="modal-footer" id="roll-modal-footer">
                    <button type="button" class="btn btn-primary" id="roll-modal-roll-btn">Roll</button>
                </div>
    `;
}

function buildDiceModalContent(result) {
    if (result.error) {
        return {
            title: 'Error',
            color: DH_COLOURS.error,
            body: `<div class="alert alert-danger">${result.error}</div>`
        };
    }

    const { isCoin, numDice, numSides, rolls, secondRoll, bonus, modifier, finalResult, title, color, flavour } = result;

    let rollDisplay = '';

    if (isCoin) {
        rollDisplay = `<div class="text-center fs-4 fw-bold">${rolls[0] === 1 ? '🪙 Heads' : '🪙 Tails'}</div>`;
    } else if (numSides === 20 && numDice === 1 && secondRoll !== null) {
        const kept = bonus === 'advantage' ? Math.max(rolls[0], secondRoll) : Math.min(rolls[0], secondRoll);
        const dropped = bonus === 'advantage' ? Math.min(rolls[0], secondRoll) : Math.max(rolls[0], secondRoll);
        rollDisplay = `
            <div class="d-flex justify-content-center gap-3 mb-3">
                <div class="text-center">
                    <div class="fw-bold fs-3" style="color:${color}">${kept}</div>
                    <small>kept</small>
                </div>
                <div class="text-center align-self-center">vs</div>
                <div class="text-center">
                    <div class="fw-bold fs-3" style="opacity:0.35">${dropped}</div>
                    <small>dropped</small>
                </div>
            </div>`;
    } else {
        rollDisplay = `
            <div class="text-center mb-3">
                <div class="fw-bold fs-3" style="color:${color}">${rolls.join(' + ')}</div>
                <small>${numDice}d${numSides}</small>
            </div>`;
    }

    let detailRows = '';
    if (modifier !== 0) {
        detailRows += `<tr><td><span class="text-secondary">Modifier</span></td><td><code>${modifier >= 0 ? '+' : ''}${modifier}</code></td></tr>`;
    }
    const detailsTable = detailRows ? `<table class="table table-sm mb-3"><tbody>${detailRows}</tbody></table>` : '';

    const totalHtml = isCoin ? '' : `
        <div class="text-center mb-2">
            <span class="fs-5">Total: </span>
            <span class="fs-3 fw-bold" style="color:${color}">${finalResult}</span>
        </div>`;

    const flavourHtml = flavour ? `<div class="text-center mt-2"><em>${flavour}</em></div>` : '';

    return {
        title,
        color,
        body: rollDisplay + detailsTable + totalHtml + flavourHtml
    };
}

function openModal() {
    const modalTitle = document.getElementById('roll-modal-title');
    const modalBody = document.getElementById('roll-modal-body');

    modalTitle.textContent = 'Dice Roll';
    modalBody.innerHTML = buildDiceModalInputs();

document.getElementById('try-dice').addEventListener('input', function() {
    const val = this.value.trim().toLowerCase();
    const result = diceRoll({ diceString: val });
    const feedback = document.getElementById('dice-feedback');
    if (result.error) {
        this.classList.remove('is-valid');
        this.classList.add('is-invalid');
        feedback.className = 'invalid-feedback';
        feedback.textContent = result.error;
    } else {
        this.classList.remove('is-invalid');
        this.classList.add('is-valid');
        feedback.className = 'valid-feedback';
        feedback.textContent = 'Looks good!';
    }
});

    document.getElementById('roll-modal-roll-btn').addEventListener('click', rollAndShowDice);
    document.getElementById('roll-modal-content').style.borderTop = '';

    const modal = new bootstrap.Modal(document.getElementById('rollResultModal'));
    modal.show();
}

function rollAndShowDice() {
    const params = {
        diceString: document.getElementById('try-dice').value || '1d20',
        bonus: document.getElementById('try-bonus').value,
        modifier: parseInt(document.getElementById('try-modifier').value) || 0,
    };

    const result = diceRoll(params);
    const { title, color, body } = buildDiceModalContent(result);

    document.getElementById('roll-modal-title').innerHTML = title;
    document.getElementById('roll-result')?.remove();

    const resultDiv = document.createElement('div');
    resultDiv.id = 'roll-result';
    resultDiv.innerHTML = body;
    document.getElementById('roll-modal-body').appendChild(resultDiv);
    document.getElementById('roll-modal-content').style.borderTop = `4px solid ${color}`;
}

window.dice_roll_web = { openModal };