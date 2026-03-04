// roll-any-web.js — Web implementation of /roll-any for twinstones.link
// Mirrors roll-any.js Discord command logic.

const ROLL_ANY_ALLOWED_DICE = ['d2', 'd4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
const MAX_TERMS = 30;
const MAX_DICE = 100;

function rollAny({ rollInput = '1d20' } = {}) {
    const rawRollInput = rollInput.toLowerCase();

    if (!/^[\dd+\-\s]+$/i.test(rawRollInput)) {
        return { error: 'Invalid input. Use format: 2d6 + d8 - 2' };
    }

    let input = rawRollInput.replaceAll(' ', '').replaceAll('--', '-').replaceAll('-', '+-');
    const rollParts = input.split('+').map(p => p.trim()).filter(p => p !== '');

    if (rollParts.length > MAX_TERMS) {
        return { error: `Too many terms (max ${MAX_TERMS}).` };
    }

    let total = 0;
    let diceCount = 0;
    let rolls = [];
    let errors = [];
    let breakdown = [];

    for (const part of rollParts) {
        if (part.includes('d')) {
            let sign = 1;
            let partClean = part;
            if (partClean.startsWith('-')) {
                sign = -1;
                partClean = partClean.substring(1);
            }
            if (partClean.startsWith('d')) partClean = '1' + partClean;

            const [numDice, numSides] = partClean.split('d').map(Number);

            if (!ROLL_ANY_ALLOWED_DICE.includes('d' + numSides)) {
                errors.push(`Dice type not allowed: ${part}`);
                continue;
            }
            if (!Number.isInteger(numDice) || !Number.isInteger(numSides) || numSides <= 0 || numDice <= 0) {
                errors.push(`Invalid dice format: ${part}`);
                continue;
            }

            diceCount += numDice;
            if (diceCount > MAX_DICE) {
                errors.push(`Too many dice (max ${MAX_DICE}).`);
                break;
            }

            const dieRolls = Array.from({ length: numDice }, () => rollDie(numSides));
            const sum = dieRolls.reduce((a, b) => a + b, 0);
            total += sign * sum;
            rolls = rolls.concat(sign === -1 ? dieRolls.map(n => -n) : dieRolls);
            breakdown.push({ label: `${sign === -1 ? '-' : ''}${numDice}d${numSides}`, rolls: dieRolls, sign, sum });

        } else if (!isNaN(part)) {
            const modifier = Number(part);
            total += modifier;
            rolls.push(modifier);
            breakdown.push({ label: modifier >= 0 ? `+${modifier}` : `${modifier}`, rolls: [modifier], sign: modifier >= 0 ? 1 : -1, sum: modifier });
        } else {
            errors.push(`Invalid input: ${part}`);
        }
    }

    if (errors.length > 0) {
        return { error: errors.join('\n') };
    }

    return { rollInput: input.replaceAll('+-', '-'), rolls, breakdown, total };
}

function buildRollAnyModalInputs() {
    return `
        <div class="row g-2 align-items-end">
            <div class="col-12">
                <label class="form-label form-label-sm mb-1">Roll Input</label>
                <input type="text" class="form-control form-control-sm" id="try-rollinput" value="1d20" placeholder="e.g. 2d6 + d8 - 2">
                <div id="rollinput-feedback" class="small mt-1"></div>
                <div class="form-text text-secondary">Allowed: ${ROLL_ANY_ALLOWED_DICE.join(', ')}</div>
            </div>
        </div>
                        <div class="modal-footer" id="roll-modal-footer">
                    <button type="button" class="btn btn-primary" id="roll-modal-roll-btn">Roll</button>
                </div>
    `;
}

function buildRollAnyModalContent(result) {
    if (result.error) {
        return {
            title: 'Error',
            color: DH_COLOURS.error,
            body: `<div class="alert alert-danger" style="white-space:pre-line">${result.error}</div>`
        };
    }

    const { rollInput, breakdown, total } = result;

    const breakdownRows = breakdown.map(b => {
        const sign = b.sign === -1 ? '−' : '+';
        const rollStr = b.rolls.map(Math.abs).join(', ');
        return `<tr>
            <td><code>${b.label}</code></td>
            <td><span class="text-secondary">[${rollStr}]</span></td>
            <td class="fw-bold text-secondary">${sign} ${Math.abs(b.sum)}</td>
        </tr>`;
    }).join('');

    const body = `
        <table class="table table-sm mb-3">
            <tbody>${breakdownRows}</tbody>
        </table>
        <div class="text-center mb-2">
            <span class="fs-5">Total: </span>
            <span class="fs-3 fw-bold" style="color:${DH_COLOURS.default}">${total}</span>
        </div>`;

    return {
        title: `Roll Result for ${rollInput}`,
        color: DH_COLOURS.default,
        body
    };
}

function openModal() {
    const modalTitle = document.getElementById('roll-modal-title');
    const modalBody = document.getElementById('roll-modal-body');

    modalTitle.textContent = 'Roll Any';
    modalBody.innerHTML = buildRollAnyModalInputs();

    document.getElementById('try-rollinput').addEventListener('input', function () {
        const result = rollAny({ rollInput: this.value });
        const feedback = document.getElementById('rollinput-feedback');
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

    document.getElementById('roll-modal-roll-btn').addEventListener('click', rollAndShowAny);
    document.getElementById('roll-modal-content').style.borderTop = '';

    const modal = new bootstrap.Modal(document.getElementById('rollResultModal'));
    modal.show();
}

function rollAndShowAny() {
    const result = rollAny({ rollInput: document.getElementById('try-rollinput').value || '1d20' });
    const { title, color, body } = buildRollAnyModalContent(result);

    document.getElementById('roll-modal-title').innerHTML = title;
    document.getElementById('roll-result')?.remove();

    const resultDiv = document.createElement('div');
    resultDiv.id = 'roll-result';
    resultDiv.innerHTML = body;
    document.getElementById('roll-modal-body').appendChild(resultDiv);
    document.getElementById('roll-modal-content').style.borderTop = `4px solid ${color}`;
}

window.roll_any_web = { openModal };
