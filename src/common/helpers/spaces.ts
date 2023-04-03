export const deleteSpace =  <T extends Object>(data: Array<T>): Array<T> => {
    return data.map( element => {
        let algo = {} as T;
        const cc = Object.entries(element).reduce((newObj, [key, val]) => {
            if (typeof val === "string") {
                newObj[key] = val.trim()
                return newObj
            }
            newObj[key] = val;
            return newObj;
        }, {})
        Object.assign(algo, cc)
        return algo;
    })
}

export const spacesObject = <T, K extends keyof T>(elements: Array<T>, spacesFor: Array<{ key: K, spaces: number }>): Array<T> => {
    return elements.map(element => {
        let algo = {} as T;
        const cc = Object.entries(element).reduce((newObj, [key, val]) => {
            if (typeof val === "string") {
                const spaceForElement = spacesFor.find(esp => esp.key === key);
                if (spaceForElement) {
                    newObj[key] = `${val.padStart(spaceForElement.spaces)}`
                    return newObj
                }
            }
            newObj[key] = val
            return newObj;
        }, {})
        Object.assign(algo, cc)
        return algo;
    })
}

export const spacesForElement = (element: string[], spaces: number = 8) => {
    return element.map( el => `'${el.padStart(spaces)}'`);
}