import {useState, useEffect} from 'react'
import './Carousel.css'

const Carousel = (props) => {
    const {children, show, infiniteLoop, navigation} = props
    const [currentIndex, setCurrentIndex] = useState(0)
    const [length, setLength] = useState(children.length)
    const [isRepeating, setIsRepeating] = useState(infiniteLoop && children.length > show)
    const [transitionEnabled, setTransitionEnabled] = useState(true)

    // Set the length to match current children from props
    useEffect(() => {
        setLength(children.length)
        setIsRepeating(infiniteLoop && children.length > show)
    }, [children, infiniteLoop, show])

    useEffect(() => {
        if (isRepeating) {
            if (currentIndex === show || currentIndex === length) {
                setTransitionEnabled(true)
            }
        }
    }, [currentIndex, isRepeating, show, length])

    const next = () => {
        if (isRepeating || currentIndex < (length - show)) {
            setCurrentIndex(prevState => prevState + 1)
        }
    }

    const prev = () => {
        if (isRepeating || currentIndex > 0) {
            setCurrentIndex(prevState => prevState - 1)
        }
    }

    const handleTransitionEnd = () => {
        if (isRepeating) {
            if (currentIndex === 0) {
                setTransitionEnabled(false)
                setCurrentIndex(length)
            } else if (currentIndex === length + show) {
                setTransitionEnabled(false)
                setCurrentIndex(show)
            }
        }
    }

    const renderExtraPrev = () => {
        let output = []
        for (let index = 0; index < show; index++) {
            output.push(children[length - 1 - index])
        }
        output.reverse()
        return output
    }

    const renderExtraNext = () => {
        let output = []
        for (let index = 0; index < show; index++) {
            output.push(children[index])
        }
        return output
    }

    useEffect(() => {
        const interval = setInterval(() => {
            next()
        }, 2000);
        return () => clearInterval(interval);
      }, []);
      

    return (
        <div className="carousel-container">
            <div className="carousel-wrapper">
                {navigation && (isRepeating || currentIndex > 0) && <button onClick={prev} className="left-arrow"> <i className="fa fa-angle-left"/> </button>}

                <div className="carousel-content-wrapper">
                    <div className={`carousel-content show-${show}`} 
                        style={{
                            transform: `translateX(-${currentIndex * (100 / show)}%)`,
                            transition: !transitionEnabled ? 'none' : undefined,
                        }} 
                    onTransitionEnd={() => handleTransitionEnd()}>
                        {(length > show && isRepeating) && renderExtraPrev()}
                        {children}
                        {(length > show && isRepeating) && renderExtraNext()}
                    </div>
                </div>

                {navigation && (isRepeating || currentIndex < (length - show)) && <button onClick={next} className="right-arrow"> <i className="fa fa-angle-right"/> </button>}
            </div>
        </div>
    )

}

export default Carousel
