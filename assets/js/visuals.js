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
        this.currentVisualType = type; // Store type for interaction handlers

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
            case 'unit_circle':
                if (this.renderUnitCircle) this.renderUnitCircle(config);
                break;
            case 'slope_scanner':
                if (this.renderSlopeScanner) this.renderSlopeScanner(config);
                break;
            case 'riemann_sum':
                if (this.renderRiemannSum) this.renderRiemannSum(config);
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
     * Renders the Unit Circle for Trigonometry.
     * Config: { showSine: boolean, showCosine: boolean }
     */
    renderUnitCircle(config) {
        // 1. Axes/Grid Background
        const centerX = 500;
        const centerY = 500;
        const radius = 200;

        // Background Grid (Optional usually, but helpful)
        this.svg.appendChild(this.createSVGElement('rect', {
            x: 100, y: 100, width: 800, height: 800, fill: "#f8fafc"
        }));

        this.svg.appendChild(this.createSVGElement('line', {
            x1: 500, y1: 100, x2: 500, y2: 900, stroke: "#9ca3af", "stroke-width": 1
        }));
        this.svg.appendChild(this.createSVGElement('line', {
            x1: 100, y1: 500, x2: 900, y2: 500, stroke: "#9ca3af", "stroke-width": 1
        }));

        // The Circle
        this.svg.appendChild(this.createSVGElement('circle', {
            cx: centerX, cy: centerY, r: radius,
            fill: "none", stroke: "#374151", "stroke-width": 3
        }));

        // 2. The Draggable Handle (The Point on Circle)
        // Start at 0 degrees (Right) -> (700, 500)
        const handleGroup = this.createSVGElement('g', {
            class: 'draggable', id: 'trig-handle',
            transform: `translate(${centerX + radius}, ${centerY})`
        });

        handleGroup.appendChild(this.createSVGElement('circle', {
            r: 15, fill: "#ef4444", stroke: "white", "stroke-width": 3
        }));
        this.svg.appendChild(handleGroup);

        // 3. Projections (Sine/Cosine lines)
        // Groups to hold them so we can update
        const projectionGroup = this.createSVGElement('g', { id: 'trig-projections' });
        this.svg.appendChild(projectionGroup);

        // Initialize projection lines (hidden or at start pos)
        const sinLine = this.createSVGElement('line', {
            id: 'sin-line', x1: 700, y1: 500, x2: 700, y2: 500,
            stroke: "#3b82f6", "stroke-width": 4
        }); // Blue for Sine (Height)

        const cosLine = this.createSVGElement('line', {
            id: 'cos-line', x1: 500, y1: 500, x2: 700, y2: 500,
            stroke: "#10b981", "stroke-width": 4
        }); // Green for Cosine (Width)

        if (config.showSine) projectionGroup.appendChild(sinLine);
        if (config.showCosine) projectionGroup.appendChild(cosLine);

        // Labels
        const infoText = this.createSVGElement('text', {
            x: 800, y: 150, "font-size": "24px", fill: "#374151", id: 'trig-info'
        });
        infoText.textContent = "Drag the dot";
        this.svg.appendChild(infoText);

        this.makeDraggable();
    }

    // ... (helper methods like handleUnitCircleDrag) ...

    handleUnitCircleDrag(element, rawX, rawY) {
        // Constrain to circle radius=200, center=500,500
        const centerX = 500;
        const centerY = 500;
        const radius = 200;

        // Calculate angle from center
        const dx = rawX - centerX;
        const dy = rawY - centerY;
        let theta = Math.atan2(dy, dx); // radians

        // Constrain Position
        const x = centerX + radius * Math.cos(theta);
        const y = centerY + radius * Math.sin(theta);

        element.setAttributeNS(null, "transform", `translate(${x}, ${y})`);

        // Update Projections
        this.updateTrigProjections(x, y, theta);
    }

    updateTrigProjections(x, y, theta) {
        const sinLine = document.getElementById('sin-line');
        const cosLine = document.getElementById('cos-line');
        const info = document.getElementById('trig-info');

        // Center is 500, 500
        // Sin line: Vertical line from point (x,y) down to x-axis (x, 500)
        // Wait, standard unit circle visual:
        // Sine is vertical distance from x-axis. So line from (x,y) to (x, 500).
        if (sinLine) {
            sinLine.setAttribute('x1', x);
            sinLine.setAttribute('y1', y);
            sinLine.setAttribute('x2', x);
            sinLine.setAttribute('y2', 500);
        }

        // Cosine is horizontal distance from y-axis. Line from (x,y) to (500, y).
        // OR typically from origin (500,500) to (x, 500) along the axis.
        // Let's do the triangle style: Origin->(x,500) and (x,500)->(x,y).
        if (cosLine) {
            cosLine.setAttribute('x1', 500);
            cosLine.setAttribute('y1', 500);
            cosLine.setAttribute('x2', x);
            cosLine.setAttribute('y2', 500); // Project onto x-axis
        }

        if (info) {
            // Convert to degrees for display, -Math.sin because SVG y is down
            // Actually, let's keep it simple.
            // Standard math: y is up. SVG: y is down.
            // So sin(theta) in math = - ((y - 500) / 200)
            const mathSin = -((y - 500) / 200);
            const degrees = Math.round((-theta * 180 / Math.PI)); // Negate for math convention? 
            // atan2(y, x). if y>0 (below center), theta is positive. 
            // In math, below center is negative angle (usually).
            // Let's just show raw Sin value.

            info.textContent = `Sin: ${mathSin.toFixed(2)}`;
        }
    }
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
        // Define Drag Strategies
        const DRAG_STRATEGIES = {
            'grid-point': {
                onDrag: (visuals, el, x, y) => {
                    // Grid Logic: Update Label live
                    // Calculate Grid Coordinates
                    // Origin: 500, 500. Grid: 50px.
                    const gridX = Math.round((x - 500) / 50);
                    const gridY = Math.round((500 - y) / 50);

                    const label = el.querySelector('#coord-label');
                    if (label) label.textContent = `(${gridX}, ${gridY})`;

                    // Allow standard drag but maybe snap later?
                    // For live drag, we usually just follow mouse or snap.
                    // The original code moved the element to x,y then snapped on end.
                    // So here we just move it.
                    el.setAttributeNS(null, "transform", `translate(${x}, ${y})`);
                },
                onEnd: (visuals, el) => {
                    const transform = el.getAttributeNS(null, "transform");
                    const pos = visuals.getTranslate(transform);

                    // Grid Logic: Snap to nearest grid intersection
                    const gridX = Math.round((pos.x - 500) / 50);
                    const gridY = Math.round((500 - pos.y) / 50);

                    const snapX = 500 + (gridX * 50);
                    const snapY = 500 - (gridY * 50);

                    el.setAttributeNS(null, "transform", `translate(${snapX}, ${snapY})`);

                    // Visual Feedback for Target (3, 2)
                    if (gridX === 3 && gridY === 2) {
                        el.querySelector('circle').setAttribute('fill', '#22c55e');
                    } else {
                        el.querySelector('circle').setAttribute('fill', '#3b82f6');
                    }
                }
            },
            'trig-handle': {
                onDrag: (visuals, el, x, y) => {
                    // Critical Fix: Call the Unit Circle constraint logic
                    visuals.handleUnitCircleDrag(el, x, y);
                },
                onEnd: (visuals, el) => {
                    // No specific end logic, stays on circle
                }
            },
            'slope-scanner': {
                onDrag: (visuals, el, x, y) => {
                    visuals.handleSlopeScannerDrag(el, x, y);
                },
                onEnd: (visuals, el) => {
                    // No specific end logic, stays on curve
                }
            },
            'riemann-slider': {
                onDrag: (visuals, el, x, y) => {
                    visuals.handleRiemannSliderDrag(el, x, y);
                },
                onEnd: (visuals, el) => {
                    // Check for success condition (N >= 50) ? 
                    // Let's just do it in drag or let engine check.
                }
            },
            'default': {
                onDrag: (visuals, el, x, y) => {
                    el.setAttributeNS(null, "transform", `translate(${x}, ${y})`);
                },
                onEnd: (visuals, el) => {
                    const transform = el.getAttributeNS(null, "transform");
                    const pos = visuals.getTranslate(transform);

                    // Check Collisions with Drop Zones (for Balance Scale / Machine)
                    let droppedZone = null;
                    for (const zone of visuals.dropZones) {
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
                            el.setAttributeNS(null, "transform", `translate(${droppedZone.x + 60}, ${droppedZone.y + 170})`);

                            // Trigger Logic
                            if (droppedZone.targetVal === 'right' && el.dataset.val == "3") {
                                visuals.updateBeamRotation(5, 5); // Balance!
                            }
                        } else if (droppedZone.type === 'function_input') {
                            // Snap to input box
                            el.setAttributeNS(null, "transform", `translate(${droppedZone.x + 50}, ${droppedZone.y + 50})`);

                            // Trigger Animation if implemented
                            if (visuals.animateProcess) {
                                visuals.animateProcess(el, "+ 2"); // Hardcoded rule for now
                            }
                        }
                    } else {
                        // Reset to bank/start (simplified)
                        // In a real app, store original pos on startDrag
                        el.setAttributeNS(null, "transform", `translate(500, 900)`);
                    }
                }
            }
        };

        let selectedElement = null;
        let offset = { x: 0, y: 0 };

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
                if (transform) {
                    const translate = this.getTranslate(transform);
                    offset.x -= translate.x;
                    offset.y -= translate.y;
                }
            }
        };

        const drag = (evt) => {
            if (selectedElement) {
                evt.preventDefault();
                if (evt.touches) { evt = evt.touches[0]; }

                const CTM = this.svg.getScreenCTM();
                const x = (evt.clientX - CTM.e) / CTM.a - offset.x;
                const y = (evt.clientY - CTM.f) / CTM.d - offset.y;

                // Execute Strategy
                const strategy = DRAG_STRATEGIES[selectedElement.id] || DRAG_STRATEGIES['default'];
                if (strategy && strategy.onDrag) {
                    strategy.onDrag(this, selectedElement, x, y);
                }
            }
        };

        const endDrag = (evt) => {
            if (selectedElement) {
                const strategy = DRAG_STRATEGIES[selectedElement.id] || DRAG_STRATEGIES['default'];
                if (strategy && strategy.onEnd) {
                    strategy.onEnd(this, selectedElement);
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
     * Renders the Slope Scanner (Calculus).
     * Config: { function: "parabola" }
     */
    renderSlopeScanner(config) {
        // 1. Grid/Axes
        // Origin: 500, 800. Scale: 1 unit = 100px.
        // Y-axis up to 200 (6 units). X-axis 200 to 800 (-3 to 3).

        // Axes
        this.svg.appendChild(this.createSVGElement('line', {
            x1: 500, y1: 200, x2: 500, y2: 800, stroke: "#374151", "stroke-width": 3
        }));
        this.svg.appendChild(this.createSVGElement('line', {
            x1: 200, y1: 800, x2: 800, y2: 800, stroke: "#374151", "stroke-width": 3
        }));

        // Function Curve y = x^2
        // Generate path data
        let pathD = "M ";
        for (let ix = -3; ix <= 3; ix += 0.1) {
            const px = 500 + ix * 100;
            const py = 800 - (ix * ix) * 100;
            pathD += `${px} ${py} L `;
        }
        pathD = pathD.slice(0, -3); // Remove last L

        this.svg.appendChild(this.createSVGElement('path', {
            d: pathD, fill: "none", stroke: "#3b82f6", "stroke-width": 4
        }));

        // 2. Tangent Line (Dynamic)
        // Group to hold tangent
        const tangentGroup = this.createSVGElement('g', { id: 'tangent-group' });
        const tangentLine = this.createSVGElement('line', {
            id: 'tangent-line', x1: 0, y1: 0, x2: 0, y2: 0,
            stroke: "#ef4444", "stroke-width": 2, "stroke-dasharray": "5,5"
        });
        tangentGroup.appendChild(tangentLine);
        this.svg.appendChild(tangentGroup);

        // 3. Scanner Tool (Draggable)
        // Start at x=0 (500, 800)
        const scannerGroup = this.createSVGElement('g', {
            class: 'draggable', id: 'slope-scanner',
            transform: `translate(500, 800)`
        });

        // Magnifying glass look
        scannerGroup.appendChild(this.createSVGElement('circle', {
            r: 30, fill: "rgba(255,255,255,0.5)", stroke: "#374151", "stroke-width": 3
        }));
        scannerGroup.appendChild(this.createSVGElement('circle', {
            r: 4, fill: "#374151" // Center dot
        }));

        // Slope Readout
        const readout = this.createSVGElement('text', {
            x: 40, y: -40, "font-size": "24px", fill: "#374151", "font-weight": "bold",
            id: 'slope-readout'
        });
        readout.textContent = "Slope: 0.0";
        scannerGroup.appendChild(readout);

        this.svg.appendChild(scannerGroup);

        // Ensure to call makeDraggable at end
        this.makeDraggable();
    }

    /**
     * Renders Riemann Sum Integration visual.
     * Config: { function: "x^2/10", range: [0, 10] }
     */
    renderRiemannSum(config) {
        // 1. Axes
        // Origin: 100, 800. 
        // X-axis: 0 to 10 (scale 80px per unit -> 800px width).
        // Y-axis: 0 to 10 (scale 60px per unit -> 600px height).

        this.svg.appendChild(this.createSVGElement('line', {
            x1: 100, y1: 800, x2: 900, y2: 800, stroke: "#374151", "stroke-width": 3
        }));
        this.svg.appendChild(this.createSVGElement('line', {
            x1: 100, y1: 200, x2: 100, y2: 800, stroke: "#374151", "stroke-width": 3
        }));

        // 2. The Curve y = x^2 / 10
        // f(x) = x^2 / 10. Max at x=10 is 100/10=10.
        // Screen X = 100 + x*80
        // Screen Y = 800 - y*60

        let pathD = "M ";
        for (let ix = 0; ix <= 10; ix += 0.1) {
            const px = 100 + ix * 80;
            const py = 800 - (Math.pow(ix, 2) / 10) * 60;
            pathD += `${px} ${py} L `;
        }
        pathD = pathD.slice(0, -3);

        this.svg.appendChild(this.createSVGElement('path', {
            d: pathD, fill: "none", stroke: "#3b82f6", "stroke-width": 4
        }));

        // 3. Rectangle Container
        const rectGroup = this.createSVGElement('g', { id: 'riemann-rects' });
        this.svg.appendChild(rectGroup);

        // 4. Slider Control (N)
        // Slider Line
        this.svg.appendChild(this.createSVGElement('line', {
            x1: 300, y1: 100, x2: 700, y2: 100, stroke: "#9ca3af", "stroke-width": 4, "stroke-linecap": "round"
        }));

        // Slider Handle
        // Range 2 to 50. Line Length 400px.
        // Start at N=2 (Left side) -> x=300.
        const sliderGroup = this.createSVGElement('g', {
            class: 'draggable', id: 'riemann-slider',
            transform: `translate(300, 100)`,
            'data-n': 2
        });

        sliderGroup.appendChild(this.createSVGElement('circle', {
            r: 15, fill: "#f59e0b", stroke: "white", "stroke-width": 3
        }));

        // Label above slider
        const label = this.createSVGElement('text', {
            x: 0, y: -25, "text-anchor": "middle", "font-size": "20px", fill: "#374151",
            "font-weight": "bold", id: 'slider-label'
        });
        label.textContent = "N = 2";
        sliderGroup.appendChild(label);

        this.svg.appendChild(sliderGroup);

        // Initial Render of Rects
        this.updateRiemannRects(2);

        this.makeDraggable();
    }

    updateRiemannRects(n) {
        const group = document.getElementById('riemann-rects');
        if (!group) return;
        group.innerHTML = '';

        // Domain [0, 10]
        const width = 10; // units
        const dx = width / n;

        for (let i = 0; i < n; i++) {
            // Left Riemann Sum
            const xVal = i * dx;
            const yVal = Math.pow(xVal, 2) / 10;

            // Screen Coords
            // x start = 100 + xVal * 80
            // width = dx * 80 - 1 (gap)
            // height = yVal * 60
            // y start = 800 - height

            const rectX = 100 + xVal * 80;
            const rectW = dx * 80 - 1;
            const rectH = yVal * 60;
            const rectY = 800 - rectH;

            if (rectH > 0) {
                group.appendChild(this.createSVGElement('rect', {
                    x: rectX, y: rectY, width: Math.max(1, rectW), height: rectH,
                    fill: "rgba(59, 130, 246, 0.3)", stroke: "#2563eb", "stroke-width": 1
                }));
            }
        }
    }

    handleRiemannSliderDrag(element, rawX, rawY) {
        // Constrain to slider line: y=100, x=[300, 700]
        const y = 100;
        let x = rawX;
        if (x < 300) x = 300;
        if (x > 700) x = 700;

        element.setAttributeNS(null, "transform", `translate(${x}, ${y})`);

        // Calculate N
        // 300->2, 700->50
        // Percent = (x - 300) / 400
        const percent = (x - 300) / 400;
        const n = Math.round(2 + percent * 48); // 2 to 50

        // Update Label
        const label = element.querySelector('#slider-label');
        if (label) label.textContent = `N = ${n}`;

        // Update Rects (Throttling would be good but JS is fast enough for 50 SVG rects)
        if (element.dataset.n != n) {
            this.updateRiemannRects(n);
            element.dataset.n = n;
        }
    }

    handleSlopeScannerDrag(element, rawX, rawY) {
        // Constrain to Parabola y = x^2
        // Origin: 500, 800. Scale: 100px.
        // Map rawX to mathX
        let mathX = (rawX - 500) / 100;

        // Clamp X to visible range [-3, 3]
        if (mathX < -3) mathX = -3;
        if (mathX > 3) mathX = 3;

        const mathY = mathX * mathX;

        // Map back to screen
        const screenX = 500 + mathX * 100;
        const screenY = 800 - mathY * 100;

        element.setAttributeNS(null, "transform", `translate(${screenX}, ${screenY})`);

        // Calculate Slope and Update Tangent
        // Slope m = 2x
        const m = 2 * mathX;

        // Update Readout
        const readout = element.querySelector('#slope-readout');
        if (readout) readout.textContent = `Slope: ${m.toFixed(1)}`;

        // Draw Tangent Line
        // Line through (screenX, screenY) with slope m (math slope).
        // Screen slope = -m (because Y up is negative).
        // Length of line? Let's say +/- 100px in X direction.

        // Point 1: x - 1, y - m (in math coords) -> screen coords
        // Delta X = 1 unit (100px). Delta Y = m units (m*100 px).
        // Left Point: (screenX - 100, screenY + m*100)
        // Right Point: (screenX + 100, screenY - m*100)

        const tanLine = document.getElementById('tangent-line');
        if (tanLine) {
            tanLine.setAttribute('x1', screenX - 100);
            tanLine.setAttribute('y1', screenY + m * 100);
            tanLine.setAttribute('x2', screenX + 100);
            tanLine.setAttribute('y2', screenY - m * 100);
        }
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

    highlightElement(id) {
        // Map abstract IDs to specific selectors/elements if needed
        let selector = id;
        if (id === 'y-axis-line') selector = '#sin-line';
        if (id === 'input-box') selector = 'rect[x="100"][y="400"]'; // specific to function machine

        const el = this.svg.querySelector(selector) || document.getElementById(id);
        if (el) {
            // Visual Flash
            const originalStroke = el.getAttribute('stroke');
            const originalWidth = el.getAttribute('stroke-width');

            el.setAttribute('stroke', '#facc15'); // Yellow warning color
            el.setAttribute('stroke-width', '8');

            setTimeout(() => {
                el.setAttribute('stroke', originalStroke);
                el.setAttribute('stroke-width', originalWidth);
            }, 1000);
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
