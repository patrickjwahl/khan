import styles from '../Admin.module.scss';

export default function Page() {
    return (
        <div className={styles.csvInfoContainer}>
            <h1>Loading Modules from CSV</h1>
            <p>That's right, you can load modules (both words and questions) from CSV! But be warned: doing so will overwrite all the current data of that type that's present in the module. Therefore, you should only use this functionality when first creating a module.</p>
            <p>If you want to replace a module's questions but keep its info screens, it's recommended to create a new module, load the questions into it from CSV, copy the info screens over from the old module, then delete the old module.</p>
            <p>GKA ignores the first line of your CSVs, so you can and should use this as a header to make sure the right data goes in the right columns. Files should have the following formats (below the headers are examples):</p>
            <h4>WORDS</h4>
            <p>Synonym lists should be semicolon-separated, and can be empty!</p>
            <table>
                <thead>
                    <tr>
                        <th>Target Language Word</th>
                        <th>Target Language Synonyms</th>
                        <th>Native Language Word</th>
                        <th>Native Language Synonyms</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>pelota</td>
                        <td>balón;baile</td>
                        <td>ball</td>
                        <td>sphere;cotillion</td>
                    </tr>
                    <tr>
                        <td>esa</td>
                        <td></td>
                        <td>that</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
            <h4>QUESTIONS/SCREENS</h4>
            <table>
                <thead>
                    <tr>
                        <th>Lesson Name</th>
                        <th>Target Language Sentence(s)</th>
                        <th>Native Language Sentence(s)</th>
                        <th>Pass (1 or 2)</th>
                        <th>Forward Trans.? (t or f)</th>
                        <th>Backward Trans.? (t or f)</th>
                        <th>Audio Trans.? (t or f)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Possession</td>
                        <td>Esa es su pelota.</td>
                        <td>[That is/That's] [his/her/their] ball.</td>
                        <td>1</td>
                        <td>t</td>
                        <td>t</td>
                        <td>f</td>
                    </tr>
                    <tr>
                        <td>Greetings</td>
                        <td>Adiós.;Hasta [tarde/la vista]</td>
                        <td>Goodbye.;Bye;See you later</td>
                        <td>2</td>
                        <td>t</td>
                        <td>t</td>
                        <td>t</td>
                    </tr>
                </tbody>
            </table>
            <p>In the questions file, you can generate variants for sentences by either separating full sentences with a semicolon (;) or by surrounding part of a sentence with brackets ([ ]) and separating the acceptable parts with a slash (/). <b>You cannot nest brackets within each other.</b></p>
            <p>Only the <b>primary variant</b> will be displayed to the user, the rest will be used for answer checking. Therefore, the primary variant should be properly capitalized and punctuated. The primary variant will be composed of the first segment of each variant section. E.g., the primary variant for <b>"That [red/blue] ball is [bouncing/rolling].;That ball is moving"</b> will be "That red ball is bouncing."</p>
        </div>
    );
}