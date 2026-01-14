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
            default:
                console.warn(`Unknown visual type: ${type}`);
        }
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
        // Left Plate Group
        const leftPlate = this.createPlateGroup(150, 400, config.leftWeight);
        beamGroup.appendChild(leftPlate);

        // Right Plate Group
        const rightPlate = this.createPlateGroup(850, 400, config.rightWeight);
        beamGroup.appendChild(rightPlate);

        this.svg.appendChild(beamGroup);

        // Calculate Rotation based on weights
        const lVal = this.parseWeight(config.leftWeight);
        const rVal = this.parseWeight(config.rightWeight);
        this.updateBeamRotation(lVal, rVal);
    }

    createPlateGroup(x, yAnchor, weightValue) {
        const group = this.createSVGElement('g', {});

        // String/Chain
        group.appendChild(this.createSVGElement('line', {
            x1: x, y1: yAnchor, x2: x, y2: yAnchor + 200,
            stroke: "#9ca3af", "stroke-width": 4
        }));

        // Plate
        group.appendChild(this.createSVGElement('rect', {
            x: x - 60, y: yAnchor + 200, width: 120, height: 10, fill: "#374151"
        }));

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
                    fill: "white", "font-size": "24px", "font-weight": "bold"
                });
                text.textContent = weightValue;
                group.appendChild(text);
            }
        }

        return group;
    }

    updateBeamRotation(left, right) {
        const beamGroup = document.getElementById('scale-beam-group');
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
        return isNaN(num) ? 5 : num; // Fallback
    }

    createSVGElement(tag, attrs) {
        const msg = document.createElementNS("http://www.w3.org/2000/svg", tag);
        for (const [key, value] of Object.entries(attrs)) {
            msg.setAttribute(key, value);
        }
        return msg;
    }
}

// Global instance
window.visuals = new VisualManager();
