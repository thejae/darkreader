import {parseColorSchemeConfig} from '../../../src/utils/colorscheme-parser';

const SEPARATOR = '='.repeat(32);

const join = (sections: string[]) => sections.join(`${SEPARATOR }

`);

test('Valid single-variant scheme', () => {
    const config = join(['Default\n\nLIGHT\nbackground: #ffffff\ntext: #000000\n']);
    const {result, error} = parseColorSchemeConfig(config);
    expect(error).toBeNull();
    expect(result.light['Default']).toEqual({backgroundColor: '#ffffff', textColor: '#000000'});
    expect(result.dark['Default']).toBeUndefined();
});

test('Valid two-variant scheme', () => {
    const config = join(['Default\n\nDARK\nbackground: #000000\ntext: #ffffff\n\nLIGHT\nbackground: #ffffff\ntext: #000000\n']);
    const {result, error} = parseColorSchemeConfig(config);
    expect(error).toBeNull();
    expect(result.dark['Default']).toEqual({backgroundColor: '#000000', textColor: '#ffffff'});
    expect(result.light['Default']).toEqual({backgroundColor: '#ffffff', textColor: '#000000'});
});

test('Lowercase variant is accepted with its real meaning', () => {
    const config = join(['Default\n\nlight\nbackground: #ffffff\ntext: #000000\n']);
    const {result, error} = parseColorSchemeConfig(config);
    expect(error).toBeNull();
    expect(result.light['Default']).toEqual({backgroundColor: '#ffffff', textColor: '#000000'});
    expect(result.dark['Default']).toBeUndefined();
});

test('Broken scheme returns an error, does not throw', () => {
    const config = join(['Default\n\nLIGHT\nbackground: notahex\ntext: #000000\n']);
    const {result, error} = parseColorSchemeConfig(config);
    expect(error).toContain('not a valid hex color');
    expect(result.light['Default']).toBeUndefined();
    expect(result.dark['Default']).toBeUndefined();
});

test('Invalid variant word is rejected', () => {
    const config = join(['Default\n\nGRAY\nbackground: #ffffff\ntext: #000000\n']);
    const {result, error} = parseColorSchemeConfig(config);
    expect(error).toContain('not a valid variant');
    expect(result.light['Default']).toBeUndefined();
});

test('Second variant must be LIGHT', () => {
    const config = join(['Default\n\nLIGHT\nbackground: #ffffff\ntext: #000000\n\nDARK\nbackground: #000000\ntext: #ffffff\n']);
    const {error} = parseColorSchemeConfig(config);
    expect(error).toContain('not a valid variant');
});
