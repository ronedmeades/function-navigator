// JavaScript test file with various function types and edge cases

// Regular function declaration
// yes
function basicFunction(param1, param2) {
    return param1 + param2;
}

// Function with no parameters
// yes
function noParams() {
    console.log("No parameters");
}

// Function with default parameters
// yes
function defaultParams(name = "Anonymous", age = 0) {
    return `${name} is ${age} years old`;
}

// Function with rest parameters
// yes
function restParams(first, ...others) {
    return [first, ...others];
}

// Function with destructured parameters
// yes
function destructuredParams({name, age}, [x, y]) {
    return `${name}, ${age}, ${x}, ${y}`;
}

// Arrow function - simple
const arrowSimple = (a, b) => a + b;

// Arrow function - complex
const arrowComplex = (user, settings) => {
    return {
        processedUser: user,
        config: settings
    };
};

// Arrow function - multiline parameters
const arrowMultiline = (
    longParameterName,
    anotherLongParameter,
    yetAnotherParameter
) => {
    return longParameterName + anotherLongParameter + yetAnotherParameter;
};

// Function expression
const functionExpression = function(data) {
    return data.toString();
};

// Anonymous function assigned to variable
const anonymousFunc = function(input) {
    return input * 2;
};

// IIFE (Immediately Invoked Function Expression)
const result = (function(value) {
    return value * 3;
})(10);

// Async function
// yes
async function fetchData(url) {
    const response = await fetch(url);
    return response.json();
}

// Async arrow function
const asyncArrow = async (id) => {
    return await database.findById(id);
};

// Generator function
// yes
function* numberGenerator(max) {
    for(let i = 0; i < max; i++) {
        yield i;
    }
}

// Class with methods
class Calculator {
    constructor(initial = 0) {
        this.value = initial;
    }
    
    // Method
    add(number) {
        this.value += number;
        return this;
    }
    
    // Method with complex parameters
    complexCalculation(
        multiplier,
        {offset = 0, precision = 2} = {},
        ...adjustments
    ) {
        return (this.value * multiplier + offset + adjustments.reduce((a, b) => a + b, 0))
            .toFixed(precision);
    }
    
    // Static method
    static create(value) {
        return new Calculator(value);
    }
    
    // Getter
    get currentValue() {
        return this.value;
    }
    
    // Setter
    set currentValue(newValue) {
        this.value = newValue;
    }
    
    // Async method
    async saveToDatabase() {
        return await database.save(this.value);
    }
}

// Function with callback parameter
function processArray(array, callback) {
    return array.map(callback);
}

// Higher-order function
function createMultiplier(factor) {
    return function(number) {
        return number * factor;
    };
}

// Function with object parameter and destructuring
function processUser({
    name,
    email,
    age = 18,
    preferences: {theme = 'light', language = 'en'} = {}
}) {
    return {name, email, age, theme, language};
}

// Overloaded-style functions (JavaScript doesn't have real overloading)
function processData(input) {
    if (typeof input === 'string') {
        return processDataString(input);
    } else if (typeof input === 'number') {
        return processDataNumber(input);
    }
}

function processDataString(str) {
    return str.toUpperCase();
}

function processDataNumber(num) {
    return num * 2;
}

// Function with very long parameter list
function functionWithManyParams(
    param1,
    param2,
    param3,
    param4,
    param5,
    param6,
    param7,
    param8
) {
    return [param1, param2, param3, param4, param5, param6, param7, param8];
}

// Module exports (if using modules)
function exportedFunction() {
    return "This function is exported";
}

// Nested functions
function outerFunction(x) {
    function innerFunction(y) {
        return x + y;
    }
    
    return innerFunction;
}

// Function with JSDoc
/**
 * Calculates the area of a rectangle
 * @param {number} width - The width of the rectangle
 * @param {number} height - The height of the rectangle
 * @returns {number} The area of the rectangle
 */
function calculateArea(width, height) {
    return width * height;
}