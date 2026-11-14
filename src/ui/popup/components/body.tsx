import {m} from 'malevic';
import {withForms} from 'malevic/forms';

import type {ExtensionActions, ExtensionData} from '../../../definitions';
import {compose} from '../../utils';
import {ArcSiteScopedBody} from '../arc-body';

import Loader from './loader';

interface BodyProps {
    data: ExtensionData;
    actions: ExtensionActions;
    fonts: string[];
    installation: {date: number; version: string};
}

/**
 * Unconditional popup root rendering Option 6b (Arc Spatial Glass — Site-Scoped).
 */
function Body(props: BodyProps, ..._children: any[]) {
    if (!props.data.isReady) {
        return (
            <body>
                <Loader complete={false} />
            </body>
        );
    }

    return (
        <body>
            <ArcSiteScopedBody data={props.data} actions={props.actions} />
        </body>
    );
}

export default compose(Body, withForms);
