import { ClipLoader } from "react-spinners";
import variables from '../_variables.module.scss';

export default function Loading() {
    return <div style={{width: '100%', paddingTop: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}><ClipLoader color={variables.themeGreen} loading={true} /></div>
}