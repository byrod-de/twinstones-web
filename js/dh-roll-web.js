const DH_COLOURS = {
    default: '#4682B4',
    hope: '#ffd500',
    fear: '#4d2689',
    critical: '#00FFCC',
    error: '#FF4C4C',
    neutral: '#4682B4'
};

// dh-roll-web.js — Web implementation of /dh-roll for twinstones.link
// Mirrors dh-roll.js Discord command logic.

function rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

function rollDice(count, sides) {
    return Array.from({ length: count }, () => rollDie(sides));
}

function dhRoll({ modifier = 0, bonus = 'none', allyDiceCount = 1, rollType = 'Action', d20Bonus = 'none' } = {}) {
    const isReaction = rollType === 'Reaction';

    const hopeDie = d20Bonus === 'hope' ? 20 : 12;
    const fearDie = d20Bonus === 'fear' ? 20 : 12;

    const hope = rollDie(hopeDie);
    const fear = rollDie(fearDie);

    let finalTotal = hope + fear + modifier;
    let bonusDetails = null;

    if (bonus === 'advantage') {
        const d6 = rollDie(6);
        bonusDetails = { type: 'advantage', rolls: [d6], value: d6 };
        finalTotal += d6;
    } else if (bonus === 'disadvantage') {
        const d6 = rollDie(6);
        bonusDetails = { type: 'disadvantage', rolls: [d6], value: d6 };
        finalTotal -= d6;
    } else if (bonus === 'ally' && allyDiceCount > 0) {
        const rolls = rollDice(allyDiceCount, 6);
        const highest = Math.max(...rolls);
        bonusDetails = { type: 'ally', rolls, value: highest };
        finalTotal += highest;
    }

    const isCrit = hope === fear;
    let outcome, color;

    if (!isReaction) {
        if (isCrit) {
            outcome = 'critical';
            color = DH_COLOURS.critical;
        } else if (hope > fear) {
            outcome = 'hope';
            color = DH_COLOURS.hope;
        } else {
            outcome = 'fear';
            color = DH_COLOURS.fear;
        }
    } else {
        outcome = isCrit ? 'critical' : 'neutral';
        color = isCrit ? DH_COLOURS.critical : DH_COLOURS.neutral;
    }

    return { hope, fear, hopeDie, fearDie, modifier, bonus, bonusDetails, rollType, isReaction, isCrit, outcome, color, finalTotal };
}

function buildModalContent(result) {
    const { hope, fear, hopeDie, fearDie, modifier, bonusDetails, rollType, isReaction, isCrit, outcome, color, finalTotal } = result;

    let titleIcon = '';
    if (outcome === 'critical') titleIcon = '<img src="images/twinstones-logo.png" alt="Critical!" width="32" height="32"> Critical!';
    else if (outcome === 'hope') titleIcon = '<img src="images/hope.png" alt="With Hope" width="32" height="32"> With Hope';
    else if (outcome === 'fear') titleIcon = '<img src="images/fear.png" alt="With Fear" width="32" height="32"> With Fear';
    else titleIcon = rollType + ' Roll';

    let flavour = '';
    if (!isReaction) {
        if (isCrit) flavour = '<small>You gain 1 Hope. You can clear 1 Stress.</small>';
        else if (outcome === 'hope') flavour = '<small>You gain 1 Hope.</small>';
        else flavour = '<small>GM gains 1 Fear.</small>';
    } else if (isCrit) {
        flavour = '<small>Critical Success!</small>';
    }

    const hopeImgStyle = outcome === 'fear' && !isCrit ? 'opacity:0.35;' : '';
    const fearImgStyle = outcome === 'hope' && !isCrit ? 'opacity:0.35;' : '';

    const diceHtml = `
        <div class="d-flex justify-content-center gap-4 mb-3">
            <div class="text-center">
                <div><img src="images/hope.png" alt="Hope" width="32" height="32" style="${hopeImgStyle}"></div>
                <div class="fw-bold fs-4" style="color:${DH_COLOURS.hope}">${hope}</div>
                <small>Hope d${hopeDie}</small>
            </div>
            <div class="text-center align-self-center fs-4">vs</div>
            <div class="text-center">
                <div><img src="images/fear.png" alt="Fear" width="32" height="32" style="${fearImgStyle}"></div>
                <div class="fw-bold fs-4" style="color:${DH_COLOURS.fear}">${fear}</div>
                <small>Fear d${fearDie}</small>
            </div>
        </div>`;

    let detailRows = '';
    if (modifier !== 0) {
        detailRows += `<tr><td><span class="text-secondary">Modifier</span></td><td><code>${modifier >= 0 ? '+' : ''}${modifier}</code></td></tr>`;
    }
    if (bonusDetails) {
        if (bonusDetails.type === 'advantage') {
            detailRows += `<tr><td><span class="text-secondary">Advantage d6</span></td><td><code>+${bonusDetails.value}</code></td></tr>`;
        } else if (bonusDetails.type === 'disadvantage') {
            detailRows += `<tr><td><span class="text-secondary">Disadvantage d6</span></td><td><code>-${bonusDetails.value}</code></td></tr>`;
        } else if (bonusDetails.type === 'ally') {
            detailRows += `<tr><td><span class="text-secondary">Ally Help d6s</span></td><td><code>[${bonusDetails.rolls.join(', ')}] → +${bonusDetails.value}</code></td></tr>`;
        }
    }

    const detailsTable = detailRows ? `
        <table class="table table-sm mb-3">
            <tbody>${detailRows}</tbody>
        </table>` : '';

    const totalHtml = `
        <div class="text-center mb-2">
            <span class="fs-5">Total: </span>
            <span class="fs-3 fw-bold" style="color:${color}">${finalTotal}</span>
        </div>
        <div class="text-center">${flavour}</div>`;

    return {
        title: `${rollType} Roll — ${titleIcon}`,
        color,
        body: diceHtml + detailsTable + totalHtml
    };
}

function openModal() {
    const modalTitle = document.getElementById('roll-modal-title');
    const modalBody = document.getElementById('roll-modal-body');

    modalTitle.textContent = 'Action Roll';
    modalBody.innerHTML = buildModalInputs();
    document.getElementById('roll-modal-roll-btn').addEventListener('click', rollAndShow);

    document.getElementById('try-bonus').addEventListener('change', function () {
        document.getElementById('try-ally-wrap').style.display = this.value === 'ally' ? '' : 'none';
    });

    const modal = new bootstrap.Modal(document.getElementById('rollResultModal'));
    modal.show();
}

function buildModalInputs() {
    return `
        <div class="row g-2 align-items-end">
            <div class="col-6">
                <label class="form-label form-label-sm mb-1">Roll Type</label>
                <select class="form-select form-select-sm" id="try-type">
                    <option value="Action">Action</option>
                    <option value="Reaction">Reaction</option>
                </select>
            </div>
            <div class="col-6">
                <label class="form-label form-label-sm mb-1">Bonus</label>
                <select class="form-select form-select-sm" id="try-bonus">
                    <option value="none">None</option>
                    <option value="advantage">Advantage</option>
                    <option value="disadvantage">Disadvantage</option>
                    <option value="ally">Ally Help</option>
                </select>
            </div>
            <div class="col-6">
                <label class="form-label form-label-sm mb-1">Modifier</label>
                <input type="number" class="form-control form-control-sm" id="try-modifier" value="0">
            </div>
            <div class="col-6">
                <label class="form-label form-label-sm mb-1">d20 Bonus</label>
                <select class="form-select form-select-sm" id="try-d20bonus">
                    <option value="none">None</option>
                    <option value="hope">Hope d20</option>
                    <option value="fear">Fear d20</option>
                </select>
            </div>
                        <div class="col-6" id="try-ally-wrap" style="display:none">
                <label class="form-label form-label-sm mb-1">Ally Dice</label>
                <input type="number" class="form-control form-control-sm" id="try-ally-dice" value="1" min="1" max="5">
            </div>
        </div>
                        <div class="modal-footer" id="roll-modal-footer">
                    <button type="button" class="btn btn-primary" id="roll-modal-roll-btn">Roll</button>
                </div>
    `;
}

function rollAndShow() {
    const params = {
        modifier: parseInt(document.getElementById('try-modifier').value) || 0,
        bonus: document.getElementById('try-bonus').value,
        rollType: document.getElementById('try-type').value,
        d20Bonus: document.getElementById('try-d20bonus').value,
        allyDiceCount: parseInt(document.getElementById('try-ally-dice').value) || 1,
    };
    const result = dhRoll(params);
    const { title, color, body } = buildModalContent(result);

    document.getElementById('roll-modal-title').innerHTML = title;
    // Remove old result if exists
    document.getElementById('roll-result')?.remove();

    // Add new result
    const resultDiv = document.createElement('div');
    resultDiv.id = 'roll-result';
    resultDiv.innerHTML = body;
    document.getElementById('roll-modal-body').appendChild(resultDiv);
    document.getElementById('roll-modal-content').style.borderTop = `4px solid ${color}`;
}


window.dh_roll_web = { openModal };