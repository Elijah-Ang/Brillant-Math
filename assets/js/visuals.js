/**
 * visuals.js
 * Handles SVG rendering and manipulation for MathFlow widgets.
 */

export class VisualManager {
    constructor() {
        this.svg = document.getElementById('main-svg');
        this.dropZones = []; // Generic drop zones
    }

    render(type, config) {
        this.svg.innerHTML = ''; // Clear canvas
        this.dropZones = []; // Reset drop zones

        switch (type) {
            case 'balance_scale_simple':
                this.renderBalanceScale(config);
                break;
            case 'function_machine':
                this.renderFunctionMachine(config);
                break;
            case 'coordinate_grid':
                if (this.renderGrid) this.renderGrid(config);
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
        // 1. Input Box (Left) - Drop Zone
        const inputBox = this.createSVGElement('rect', {
            x: 100, y: 400, width: 100, height: 100,
            fill: "#e5e7eb", rx: 10, stroke: "#9ca3af", "stroke-width": 2
        });
        this.svg.appendChild(inputBox);
        this.dropZones.push({
            id: 'input-box', x: 100, y: 400, width: 100, height: 100,
            type: 'function_input', targetVal: 'input'
        });

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

        // 5. Input Items (Draggable)
        // Just showing one static input for now that "could" be dragged
        const inputItem = this.createDraggableWeight(130, 430, config.inputs ? config.inputs[0] : 2);
        this.svg.appendChild(inputItem);

        this.makeDraggable();
    }

    /**
     * Renders a Coordinate Grid.
     * Config: { targetX: number, targetY: number }
     */
    renderGrid(config) {
        // 1. Grid Lines
        const gridSize = 50;
        const centerX = 500;
        const centerY = 500;
        const width = 800;
        const height = 800; // use a box centered at 500,500

        // Background
        this.svg.appendChild(this.createSVGElement('rect', {
            x: 100, y: 100, width: width, height: height, fill: "#f3f4f6"
        }));

        // Lines
        for (let i = 100; i <= 900; i += gridSize) {
            // Vertical
            this.svg.appendChild(this.createSVGElement('line', {
                x1: i, y1: 100, x2: i, y2: 900, stroke: "#d1d5db", "stroke-width": 1
            }));
            // Horizontal
            this.svg.appendChild(this.createSVGElement('line', {
                x1: 100, y1: i, x2: 900, y2: i, stroke: "#d1d5db", "stroke-width": 1
            }));
        }

        // Axes (Bold)
        // Y-Axis
        this.svg.appendChild(this.createSVGElement('line', {
            x1: centerX, y1: 100, x2: centerX, y2: 900, stroke: "#374151", "stroke-width": 3
        }));
        // X-Axis
        this.svg.appendChild(this.createSVGElement('line', {
            x1: 100, y1: centerY, x2: 900, y2: centerY, stroke: "#374151", "stroke-width": 3
        }));

        // Labels (Simple)
        const origin = this.createSVGElement('text', {
            x: centerX - 20, y: centerY + 30, "font-size": "20px", fill: "#374151"
        });
        origin.textContent = "(0,0)";
        this.svg.appendChild(origin);

        // 2. Draggable Point (The "Blue Dot")
        // Start at 0,0 (500, 500)
        // Target: (3, 2). Grid unit = 50px.
        // Target Pixel: 500 + 3*50 = 650, 500 - 2*50 = 400.

        const pointGroup = this.createSVGElement('g', {
            class: 'draggable',
            transform: `translate(500, 500)`, // Start at origin
            id: 'grid-point'
        });

        pointGroup.appendChild(this.createSVGElement('circle', {
            cx: 0, cy: 0, r: 15, fill: "#3b82f6", stroke: "white", "stroke-width": 3
        }));

        // Coordinate Label
        const label = this.createSVGElement('text', {
            x: 20, y: -20, "font-size": "24px", fill: "#3b82f6", "font-weight": "bold",
            "pointer-events": "none", id: 'coord-label'
        });
        label.textContent = "(0, 0)";
        pointGroup.appendChild(label);

        this.svg.appendChild(pointGroup);

        this.makeDraggable();
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

        // Register Drop Zones (Approximation for rotating plates)
        // For MVP, we use generous static bounding boxes around where plates generally are.
        this.dropZones.push({
            id: 'left-plate', x: 90, y: 400, width: 120, height: 400,
            type: 'scale_plate', targetVal: 'left'
        });
        this.dropZones.push({
            id: 'right-plate', x: 790, y: 400, width: 120, height: 400,
            type: 'scale_plate', targetVal: 'right'
        });

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
        // Remove existing listeners if any (simple implementation: just re-add, browsers handle multiples okay usually but better to clean up. 
        // For prototype, we'll just be careful not to call it multiple times per render or rely on the fact that we clear innerHTML so elements are new.)

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
                if (evt.touches) { evt = evt.touches[0]; }

                const CTM = this.svg.getScreenCTM();
                const x = (evt.clientX - CTM.e) / CTM.a - offset.x;
                const y = (evt.clientY - CTM.f) / CTM.d - offset.y;

                selectedElement.setAttributeNS(null, "transform", `translate(${x}, ${y})`);

                // Grid Specific: Update Label live
                if (selectedElement.id === 'grid-point') {
                    // Calculate Grid Coordinates
                    // Origin: 500, 500. Grid: 50px.
                    // X = (x - 500) / 50
                    // Y = (500 - y) / 50 (Y is up)

                    const gridX = Math.round((x - 500) / 50);
                    const gridY = Math.round((500 - y) / 50);

                    const label = selectedElement.querySelector('#coord-label');
                    if (label) label.textContent = `(${gridX}, ${gridY})`;
                }
            }
        };

        const endDrag = (evt) => {
            if (selectedElement) {
                const transform = selectedElement.getAttributeNS(null, "transform");
                const pos = this.getTranslate(transform);

                // Grid Logic: Snap to nearest grid intersection
                if (selectedElement.id === 'grid-point') {
                    const gridX = Math.round((pos.x - 500) / 50);
                    const gridY = Math.round((500 - pos.y) / 50);

                    const snapX = 500 + (gridX * 50);
                    const snapY = 500 - (gridY * 50);

                    selectedElement.setAttributeNS(null, "transform", `translate(${snapX}, ${snapY})`);

                    // Check Answer? 
                    // This would ideally communicate back to the engine.
                    // For now, if (3, 2), simplify visual feedback
                    if (gridX === 3 && gridY === 2) {
                        selectedElement.querySelector('circle').setAttribute('fill', '#22c55e');
                    } else {
                        selectedElement.querySelector('circle').setAttribute('fill', '#3b82f6');
                    }
                    return;
                }


                // Check Collisions with Drop Zones
                let droppedZone = null;
                for (const zone of this.dropZones) {
                    if (pos.x >= zone.x && pos.x <= zone.x + zone.width &&
                        pos.y >= zone.y && pos.y <= zone.y + zone.height) {
                        droppedZone = zone;
                        break;
                    }
                }

                if (droppedZone) {
                    console.log("Dropped in zone:", droppedZone.id);

                    if (droppedZone.type === 'scale_plate') {
                        // Snap to plate center (approx)
                        selectedElement.setAttributeNS(null, "transform", `translate(${droppedZone.x + 60}, ${droppedZone.y + 170})`);

                        // Trigger Logic
                        if (droppedZone.targetVal === 'right' && selectedElement.dataset.val == "3") {
                            this.updateBeamRotation(5, 5); // Balance!
                        }
                    } else if (droppedZone.type === 'function_input') {
                        // Snap to input box
                        selectedElement.setAttributeNS(null, "transform", `translate(${droppedZone.x + 50}, ${droppedZone.y + 50})`);

                        // Trigger Animation if implemented
                        if (this.animateProcess) {
                            this.animateProcess(selectedElement, "+ 2"); // Hardcoded rule for now
                        }
                    }
                } else {
                    // Reset to bank/start (simplified)
                    // In a real app, store original pos on startDrag
                    selectedElement.setAttributeNS(null, "transform", `translate(500, 900)`);
                }

                selectedElement = null;
            }
        };

        // Note: In a production app, use named handlers to removeEventListeners correctly.
        // For this artifact, we rely on the fact that SVG content is often regenerated.
        this.svg.onmousedown = startDrag;
        this.svg.onmousemove = drag;
        this.svg.onmouseup = endDrag;

        this.svg.ontouchstart = startDrag;
        this.svg.ontouchmove = drag;
        this.svg.addEventListener('touchend', endDrag);
    }

    /**
     * Animates an item passing through the Function Machine.
     * @param {SVGElement} itemGroup - The draggable group element
     * @param {string} rule - The rule to apply (e.g., "+ 2")
     */
    animateProcess(itemGroup, rule) {
        // Disable interaction
        itemGroup.classList.remove('draggable');

        // 1. Move to Center (Processing)
        const startTransform = itemGroup.getAttribute('transform');
        const startPos = this.getTranslate(startTransform);
        const centerPos = { x: 470, y: 420 }; // Roughly center of machine rect (400,350 to 600,550)

        // Simple linear interpolation animation function
        this.animateMove(itemGroup, startPos, centerPos, 500, () => {
            // 2. Transform Logic (Center Stage)
            // Update text content based on rule
            const textEl = itemGroup.querySelector('text');
            const currentVal = parseInt(itemGroup.dataset.val);
            let newVal = currentVal;

            // Very basic rule parsing
            if (rule.includes("+")) {
                newVal += parseInt(rule.split('+')[1]);
            } else if (rule.includes("*")) {
                newVal *= parseInt(rule.split('*')[1]);
            }

            // Update Visual
            textEl.textContent = newVal;
            itemGroup.dataset.val = newVal;

            // Optional: visual "pop" or color change
            itemGroup.querySelector('rect').setAttribute('fill', '#22c55e'); // Green

            // 3. Move to Output (Right)
            // Output box is at 800, 400. Center approx 850, 450
            const endPos = { x: 850, y: 450 };

            setTimeout(() => {
                this.animateMove(itemGroup, centerPos, endPos, 500, () => {
                    // Check if this matches the target for the lesson? 
                    // For now, just leaving it in the bin.
                });
            }, 500); // Wait 500ms in machine
        });
    }

    animateMove(element, from, to, duration, onComplete) {
        const startTime = performance.now();

        const loop = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);

            const currentX = from.x + (to.x - from.x) * ease;
            const currentY = from.y + (to.y - from.y) * ease;

            element.setAttribute('transform', `translate(${currentX}, ${currentY})`);

            if (progress < 1) {
                requestAnimationFrame(loop);
            } else {
                if (onComplete) onComplete();
            }
        };
        requestAnimationFrame(loop);
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
