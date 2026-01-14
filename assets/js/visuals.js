/**
 * visuals.js
 * Handles SVG rendering and manipulation for MathFlow widgets.
 */

export class VisualManager {
    constructor() {
        this.svg = document.getElementById('main-svg');
    }

    render(type, config) {
        this.svg.innerHTML = ''; // Clear canvas

        switch (type) {
            case 'balance_scale_simple':
                this.renderBalanceScale(config);
                break;
            case 'function_machine':
                this.renderFunctionMachine(config);
                break;
            default:
                console.warn(`Unknown visual type: ${type}`);
        }
    }

    /**
     * Renders a Function Machine.
     * Config: { rule: string, inputs: number[], animationSpeed: string }
     */
    renderFunctionMachine(config) {
        // 1. Input Box (Left)
        const inputBox = this.createSVGElement('rect', {
            x: 100, y: 400, width: 100, height: 100,
            fill: "#e5e7eb", rx: 10, stroke: "#9ca3af", "stroke-width": 2
        });
        this.svg.appendChild(inputBox);

        // 2. Machine Body (Center) with Rule Text
        const machine = this.createSVGElement('rect', {
            x: 400, y: 350, width: 200, height: 200,
            fill: "#3b82f6", rx: 20
        });
        this.svg.appendChild(machine);

        const ruleText = this.createSVGElement('text', {
            x: 500, y: 450, "text-anchor": "middle", "dominant-baseline": "middle",
            fill: "white", "font-size": "32px", "font-weight": "bold",
            "font-family": "monospace"
        });
        ruleText.textContent = config.rule || "f(x)";
        this.svg.appendChild(ruleText);

        // 3. Output Box (Right)
        const outputBox = this.createSVGElement('rect', {
            x: 800, y: 400, width: 100, height: 100,
            fill: "#e5e7eb", rx: 10, stroke: "#9ca3af", "stroke-width": 2
        });
        this.svg.appendChild(outputBox);

        // 4. Connecting Pipes
        const pipe1 = this.createSVGElement('line', {
            x1: 200, y1: 450, x2: 400, y2: 450,
            stroke: "#6b7280", "stroke-width": 10
        });
        this.svg.appendChild(pipe1);

        const pipe2 = this.createSVGElement('line', {
            x1: 600, y1: 450, x2: 800, y2: 450,
            stroke: "#6b7280", "stroke-width": 10
        });
        this.svg.appendChild(pipe2);

        // 5. Input Items (Draggable) - Simplified for demo
        // Just showing one static input for now that "could" be dragged
        const inputItem = this.createDraggableWeight(130, 430, config.inputs ? config.inputs[0] : 2);
        this.svg.appendChild(inputItem); // In a real app, we'd add drag logic specific to machine inputs
    }

    /**
     * Renders a basic balance scale.
     * Config: { leftWeight: number|string, rightWeight: number, target: "equal"|"isolate" }
     */
    renderBalanceScale(config) {
        // 1. Draw Static Base
        const base = this.createSVGElement('path', {
            d: "M 450 800 L 550 800 L 500 400 Z",
            class: "scale-base"
        });
        this.svg.appendChild(base);

        // 2. Draw Beam Group (pivot at 500, 400)
        const beamGroup = this.createSVGElement('g', {
            id: 'scale-beam-group',
            class: 'scale-beam'
        });

        // Beam bar
        const beam = this.createSVGElement('rect', {
            x: 100, y: 395, width: 800, height: 10, rx: 5, fill: "#374151"
        });
        beamGroup.appendChild(beam);

        // Plates (hanging from beam)
        // Left Plate Group (Drop Zone 1)
        const leftPlate = this.createPlateGroup(150, 400, config.leftWeight, 'left-plate');
        beamGroup.appendChild(leftPlate);

        // Right Plate Group (Drop Zone 2)
        const rightPlate = this.createPlateGroup(850, 400, config.rightWeight, 'right-plate');
        beamGroup.appendChild(rightPlate);

        this.svg.appendChild(beamGroup);

        // 3. Weight Bank (Draggable Items) - Simplified for now
        // We'll create a "Bank" area at the bottom for new weights
        const bankGroup = this.createSVGElement('g', { id: 'weight-bank' });

        // Example draggable weights
        const draggableWeight = this.createDraggableWeight(500, 900, 3);
        bankGroup.appendChild(draggableWeight);

        this.svg.appendChild(bankGroup);

        // Calculate Rotation based on weights
        const lVal = this.parseWeight(config.leftWeight);
        const rVal = this.parseWeight(config.rightWeight);
        this.updateBeamRotation(lVal, rVal);

        // Enable global drag handler
        this.makeDraggable();
    }

    createPlateGroup(x, yAnchor, weightValue, id) {
        const group = this.createSVGElement('g', { id: id });

        // String/Chain
        group.appendChild(this.createSVGElement('line', {
            x1: x, y1: yAnchor, x2: x, y2: yAnchor + 200,
            stroke: "#9ca3af", "stroke-width": 4
        }));

        // Plate (Drop Zone)
        const plate = this.createSVGElement('rect', {
            x: x - 60, y: yAnchor + 200, width: 120, height: 10, fill: "#374151",
            class: "plate-rect"
        });
        group.appendChild(plate);

        // Visual Weight Representation
        if (weightValue) {
            const isBox = typeof weightValue === 'string' && weightValue.includes("box");
            if (isBox) {
                // Draw Box
                group.appendChild(this.createSVGElement('rect', {
                    x: x - 30, y: yAnchor + 140, width: 60, height: 60,
                    class: "weight-block weight-box"
                }));
                // If it's "box+2", maybe draw extra blocks? Simplified for now.
            } else {
                // Draw Number Block
                group.appendChild(this.createSVGElement('rect', {
                    x: x - 30, y: yAnchor + 140, width: 60, height: 60,
                    fill: "#f59e0b", class: "weight-block"
                }));
                const text = this.createSVGElement('text', {
                    x: x, y: yAnchor + 170, "text-anchor": "middle",
                    fill: "white", "font-size": "24px", "font-weight": "bold",
                    "pointer-events": "none"
                });
                text.textContent = weightValue;
                group.appendChild(text);
            }
        }

        return group;
    }

    createDraggableWeight(x, y, val) {
        const group = this.createSVGElement('g', {
            class: 'draggable',
            transform: `translate(${x}, ${y})`,
            'data-val': val
        });

        group.appendChild(this.createSVGElement('rect', {
            x: -30, y: -30, width: 60, height: 60,
            fill: "#f59e0b", class: "weight-block",
            rx: 5
        }));

        const text = this.createSVGElement('text', {
            x: 0, y: 0, "text-anchor": "middle", "dominant-baseline": "middle",
            fill: "white", "font-size": "24px", "font-weight": "bold",
            "pointer-events": "none"
        });
        text.textContent = val;
        group.appendChild(text);

        return group;
    }

    updateBeamRotation(left, right) {
        const beamGroup = document.getElementById('scale-beam-group');
        if (!beamGroup) return;

        let angle = 0;
        if (left > right) angle = -20;
        else if (right > left) angle = 20;

        // Apply rotation around pivot (500, 400)
        // transform-origin is set in CSS, but explicit transform here
        // We use template literal for transform string
        beamGroup.style.transform = `rotate(${angle}deg)`;
    }

    parseWeight(val) {
        if (typeof val === 'number') return val;
        // simplistic parsing for "box+2" -> assuming box=x.
        // For static rendering, we might just assume 0 for box?
        // or parse int.
        // For this demo: parsing "box+2" -> return 2 (assuming box is weightless?? No, box is heavy)
        // Let's just strip non-numeric
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num; // Default to 0 if unknown
    }

    createSVGElement(tag, attrs) {
        const msg = document.createElementNS("http://www.w3.org/2000/svg", tag);
        for (const [key, value] of Object.entries(attrs)) {
            msg.setAttribute(key, value);
        }
        return msg;
    }

    makeDraggable() {
        let selectedElement = null;
        let offset = { x: 0, y: 0 };

        // Use arrow function to preserve 'this'
        const startDrag = (evt) => {
            if (evt.target.parentNode.classList.contains('draggable')) {
                selectedElement = evt.target.parentNode;

                // Get mouse position relative to SVG
                const CTM = this.svg.getScreenCTM();
                if (evt.touches) {
                    evt = evt.touches[0];
                }
                offset.x = (evt.clientX - CTM.e) / CTM.a;
                offset.y = (evt.clientY - CTM.f) / CTM.d;

                // Get initial translation
                const transform = selectedElement.getAttributeNS(null, "transform");
                const translate = this.getTranslate(transform);
                offset.x -= translate.x;
                offset.y -= translate.y;
            }
        };

        const drag = (evt) => {
            if (selectedElement) {
                evt.preventDefault();
                if (evt.touches) {
                    evt = evt.touches[0];
                }

                const CTM = this.svg.getScreenCTM();
                const x = (evt.clientX - CTM.e) / CTM.a - offset.x;
                const y = (evt.clientY - CTM.f) / CTM.d - offset.y;

                selectedElement.setAttributeNS(null, "transform", `translate(${x}, ${y})`);
            }
        };

        const endDrag = (evt) => {
            if (selectedElement) {
                // Check Drop Zones
                // Simplification for prototype: check simple distance to Right Plate
                const transform = selectedElement.getAttributeNS(null, "transform");
                const pos = this.getTranslate(transform);

                // Right plate rough area: x=850, y=600 (from createPlateGroup logic + beam height)
                // Note: The beam rotates, so the y changes.
                // For MVP, we'll just check if x is in right half of screen

                if (pos.x > 700 && pos.x < 900 && pos.y < 800) {
                    // Snapped!
                    // Trigger update (hacky linkage to update visual state)
                    // In real app, we'd update state in Engine, then re-render
                    // For now, let's just physically snap it to the plate and maybe simulate the tip

                    // Snap visual
                    selectedElement.setAttributeNS(null, "transform", `translate(850, 570)`);

                    // Check who is asking? (Hardcoded for "Equal" lesson)
                    if (selectedElement.dataset.val == "3") {
                        // We assume we added 3kg to right (2kg). 2+3 = 5. Left is 5. Balanced!
                        this.updateBeamRotation(5, 5);
                        // Auto-select correct answer in quiz? Or just give visual cue?
                    }
                } else {
                    // Reset to bank
                    selectedElement.setAttributeNS(null, "transform", `translate(500, 900)`);
                }

                selectedElement = null;
            }
        };

        this.svg.addEventListener('mousedown', startDrag);
        this.svg.addEventListener('mousemove', drag);
        this.svg.addEventListener('mouseup', endDrag);

        this.svg.addEventListener('touchstart', startDrag);
        this.svg.addEventListener('touchmove', drag);
        this.svg.addEventListener('touchend', endDrag);
    }

    /**
     * Shows a specific visual scenario (e.g., for feedback).
     * @param {string} visualType 
     * @param {any} value - The User's wrong answer or a config object
     */
    showScenario(visualType, value) {
        if (visualType === 'balance_scale_simple') {
            // value is likely the "weight" the user guessed, e.g. "5kg"
            // or just the raw number 5.
            // We want to simulate putting that weight on the right side (assuming we are solving for X on left)
            // For "What is Equality" (Left=5, Right=2), if they pick "5kg":
            // We add 5 to Right. Right becomes 7. Left is 5. Right > Left. Tip Right.

            // Rough heuristic for Phase 1 demo:
            // We assume the question is "Add to Right".
            // Left is fixed at 5. Right starts at 2. User adds 'value'.
            const leftTotal = 5;
            const rightTotal = 2 + this.parseWeight(value);

            this.updateBeamRotation(leftTotal, rightTotal);

            // Also maybe flash the scale?
            const beam = document.querySelector('.scale-beam');
            if (beam) {
                beam.style.transition = "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
            }
        }
    }

    getTranslate(transformStr) {
        if (!transformStr) return { x: 0, y: 0 };
        const match = /translate\(([^,]+),\s*([^)]+)\)/.exec(transformStr);
        if (match) {
            return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
        }
        return { x: 0, y: 0 };
    }
}

// Global instance
window.visuals = new VisualManager();
