import React, { useState }from 'react';
import ReactDOM from 'react-dom';
import './styles.css';

interface IDailyForecast {

    datetime: string,
    weather: {
        description: string,
        icon: string,
        code: string
    },
    temp: string,
    wind_cdir: string,
    wind_spd: string,
    pop: string,
    rh: string,
    high_temp: string,
    low_temp: string,
};

function genImageLink( icon: string ): string {

    return icon ? `https://www.weatherbit.io/static/img/icons/${icon}.png` : '';
}

function convertTemp( value: number, unit: string ): number {

    if ( unit === 'fah' ) {

        return ( value * 9 / 5 ) + 32;
    }
    else if ( unit === 'cel' ) {

        return ( value - 32 ) * 5 / 9;
    }

    return value;
}

const getForecasts = async ( city: string ): Promise<any> => {

    const apiKey: string = '45190ac29a58464eb0770d64b678a766';
    const country: string = 'AU';
    const url: string = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&country=${country}&key=${apiKey}`;

    return fetch( url ).then( response => response.json() );
}

type HeadingProps = {

    city: string,
    datetime: string,
    description: string,
    icon: string,
    temp: string,
    wind: string,
    humid: string,
    precip: string,
};

const Heading: React.FC<HeadingProps> = ( props ) => {

    const imageSrc: string = genImageLink( props.icon );

    return  <div className="heading">
                <div className="heading__today">
                    <h1>{ props.city }</h1>
                    <time dateTime={props.datetime}>{ props.datetime }</time>
                    <div>{ props.description }</div>
                    <div className="heading__display">
                        <img className="heading__image" alt="" aria-label="Image of weather" src={imageSrc} />
                        <div className="heading__temp">{ props.temp }</div>
                    </div>
                </div>
                <div className="heading__summary">
                    <ul className="heading__summary-list">
                        <li>Pricipitation: { props.precip } </li>
                        <li>Humidity: { props.humid }</li>
                        <li>Wind: { props.wind }</li>
                    </ul>
                </div>
            </div>
}

type DailyProps = {

    datetime: string,
    icon: string,
    highTemp: string,
    lowTemp: string,
    unit: string
};

const Daily: React.FC<DailyProps> = ( props ) => {

    const imageSrc: string = genImageLink( props.icon );
    let unitLiteral: string = '';

    if ( props.unit === 'cel' ) {
        unitLiteral = 'Celsius';
    }
    else if ( props.unit === 'fah' ) {
        unitLiteral = 'Fahrenheit';
    }

    return  <div className="daily">
                <h2 className="daily__day">{ props.datetime }</h2>
                <img alt="" aria-label="Image of weather" src={imageSrc} />
                <div>
                    <span className="daily__highest"
                          aria-label={ `Highest temperature is ${props.highTemp} degrees ${unitLiteral}` }
                    >
                        { props.highTemp + '°' }
                    </span>
                    <span className="daily__lowest"
                          aria-label={ `Lowest temperature is ${props.lowTemp} degrees ${unitLiteral}` }
                    >
                        { props.lowTemp + '°' }
                    </span>
                </div>
            </div>
}

type ContentProps = {

    cityName: string,
    forecasts: IDailyForecast[],
    unit: string,
};

const Content: React.FC<ContentProps> = ( { cityName, forecasts, unit } ) => {

    const wind = `${3.6 * parseInt(forecasts[0].wind_spd)} kph ${forecasts[0].wind_cdir}`;

    if ( !cityName ) return null;

    return  <div>
                <Heading
                    city={cityName}
                    datetime={ new Date(forecasts[0].datetime).toString().slice(0,10) }
                    description={ forecasts[0].weather.description }
                    icon={ forecasts[0].weather.icon }
                    temp={ parseFloat(forecasts[0].temp).toFixed(1).toString() + '°' }
                    wind={ wind }
                    precip={ forecasts[0].pop + '%' }
                    humid={ forecasts[0].rh + '%'}
                />
                <div className="daily-forecast"> 
                {
                    forecasts.map( (fc, index) => {

                        let day: string = 'Today';
                        let today: Date = new Date( fc.datetime );

                        const days = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                        if ( index > 0 ) {
                            day = days[ today.getDay() % 7 ];
                        }

                        return  <Daily key={ fc.datetime }
                                       datetime={ day } 
                                       icon={ fc.weather.icon }
                                       highTemp={ parseFloat(fc.high_temp).toFixed(1).toString() }
                                       lowTemp={ parseFloat(fc.low_temp).toFixed(1).toString() }
                                       unit={ unit }
                                />
                    })
                }
                </div>
            </div>
}

const Widget: React.FC = () => {

    const [ city, setCity ] = useState<string>('sydney');
    const [ cityName, setCityName ] = useState<string>('');
    const [ unit, setUnit ] = useState<string>('cel');
    const [ dailyForecasts, setDailyForecasts ] = useState<IDailyForecast[]>([{

        datetime: '',
        weather: { icon: '', code: '', description: '' },
        temp: '',
        wind_cdir: '',
        wind_spd: '',
        pop: '',
        rh: '',
        high_temp: '',
        low_temp: '',
    }]);

    async function handleSubmit( event: any ): Promise<any> {

        event.preventDefault();
        const result = await getForecasts( city );
        let weekData = result.data.slice(0, 7);

        if ( unit === 'fah' ) {
            weekData = createForecastsByUnit( weekData, unit );
        }

        setDailyForecasts( weekData );
        setCityName( result.city_name );
    }

    function handleUnitChange( event: any ): void {

        const unit = event.target.value;
        setUnit( unit );

        const newForecasts = createForecastsByUnit( dailyForecasts, unit );
        setDailyForecasts( newForecasts );
    }

    function createForecastsByUnit( forecasts: IDailyForecast[], unit: string ): IDailyForecast[] {

        const copy: IDailyForecast[] = JSON.parse( JSON.stringify(forecasts) );

        return copy.map( fc => {

            fc.temp = convertTemp( parseFloat(fc.temp), unit ).toString();
            fc.high_temp = convertTemp( parseFloat(fc.high_temp), unit ).toString();
            fc.low_temp = convertTemp( parseFloat(fc.low_temp), unit ).toString();

            return fc;
        } )
    }

    return  <div>
                <form onSubmit={ handleSubmit }>
                    <label>Enter city
                        <input type="text" 
                               defaultValue={city} 
                               onChange={ event => setCity( event.target.value ) }
                        />
                    </label>
                    <input type="submit" value="Search" />
                    <label>
                        <input name="unit" 
                               type="radio" 
                               value="cel" 
                               onChange={ handleUnitChange } 
                               defaultChecked={true}
                        />
                        Celsius
                    </label>
                    <label>
                        <input name="unit" 
                               type="radio" 
                               value="fah" 
                               onChange={ handleUnitChange } 
                        />
                        Fahrenheit
                    </label>
                </form>
                <Content cityName={cityName} forecasts={dailyForecasts} unit={unit} />
            </div>
}

ReactDOM.render(
    <Widget />,
    document.getElementById('container')
);
