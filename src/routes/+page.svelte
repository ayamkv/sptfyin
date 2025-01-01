<script>
    import { Button } from "$lib/components/ui/button";
    import { goto } from "$app/navigation";
    import { Turnstile } from 'svelte-turnstile';
    import { fly, slide } from 'svelte/transition';
    import { toast } from "svelte-sonner";
    import { getRecords, createRecord, generateRandomURL, getRecentRecords, validateToken } from '$lib/pocketbase';
    // import { generateRandomURL } from "$lib/utils";
    import * as Drawer from "$lib/components/ui/drawer/index.js";
    import * as Card from "$lib/components/ui/card";
    import { Switch } from "$lib/components/ui/switch";
    import { Input } from "$lib/components/ui/input";
    import * as Select from "$lib/components/ui/select/index.js";
    import { Label } from "$lib/components/ui/label";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Separator } from "$lib/components/ui/separator";
    import * as Accordion from "$lib/components/ui/accordion";
    import 'iconify-icon';
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { strings } from "$lib/localization/languages/en.json"
    import { onMount } from "svelte";
	  import { get } from "svelte/store";

    // These variables will be undefined during SSR
    let scrollHere
    let accordionValue = 'one'
    let customShortId
    let turnstileResponse
    let isIOS, isAndroid, isMobile, isSafari, isFirefox, isOldFirefox;
    let records = []
    let rrecords
    let recordsPromise;
    let error = null;
    let recentLoading = true;
    let currentItems = 4

    function scrollToBottom() {
      scrollHere.scrollIntoView()
    }

    function setAccordionValue(newValue) {
      accordionValue = newValue;
    }


    function localizeDate(date) {
        return new Date(date).toLocaleString();
    }

    async function fetchData() {
        recentLoading = true;
        try {
          
            const response = await getRecentRecords();
            records = response.items
 
        } catch (error) {
            console.error(error);
        } finally {
            recentLoading = false;
        }
      }
      onMount(async () => {
        recordsPromise = await fetchData();
        rrecords = records;
        // console.log('from onm async: ', records);

      });
    // This function will only run in the browser
    function getBrowserName() {
       const userAgent = navigator.userAgent;

        switch (true) {
         case userAgent.includes("Chrome") && !userAgent.includes("Edg"):
            return "Chrome";
        case userAgent.includes("Firefox"):
            return "Firefox";
        case userAgent.includes("Safari") && !userAgent.includes("Chrome"):
            return "Safari";
        case userAgent.includes("Edg"):
            return "Edge";
        case userAgent.includes("Trident"):
            return "Internet Explorer";
        case userAgent.includes("OPR"):
            return "Opera";
        default:
            return "Unknown Browser";
    }
}


    onMount(() => {
        
        const ua = navigator.userAgent.toLowerCase();
        isIOS = ua.includes("iphone os") || (ua.includes("mac os") && navigator.maxTouchPoints > 0);
        isAndroid = ua.includes("android");
        isMobile = ua.includes("android") || isIOS;
        isSafari = ua.includes("safari/");
        isFirefox = ua.includes("firefox/");
        isOldFirefox = ua.includes("firefox/") && ua.split("firefox/")[1].split('.')[0] < 103;
        // console log the ua user is using
        console.log(getBrowserName());

        
    });
    // onMount(async () => {
    //   try {
    //     records = await getRecords('random_short');
    //   } catch (err) {
    //     error = `Failed to load records: ${err.response.status} ${err.response.statusText}`;
    //   }
    // });
    let reset
    let shortIdDisplay = '####';
    let inputText = null
    let isError = false;
    let alertDialogTitle = ''
    let alertDialogDescription = ''
    let errorIconDefault = 'fluent-emoji:crying-cat'
    let errorIcon = errorIconDefault
    let focus1 = false;
    let theButton
    let fullShortURL 
    let recent = []
    $: isInputTextEmpty = true
    function findUrl(str) {
        const regex = /^(https:\/\/[a-z]+\.spotify\.com\/)(playlist|artist|album|track|episode|show|user)\/.*$/mg;
        let urls = str.match(regex);
        return urls ? urls[0] : null;
    }
    if (inputText !== null) {
      isInputTextEmpty = false
    } 
    async function handlePaste(event) {
    try {
      // Request permission to access the clipboard
      const permission = await navigator.permissions.query({ name: 'clipboard-read' });

      if (permission.state === 'granted' || permission.state === 'prompt') {
        // Read from the clipboard
        const text = await navigator.clipboard.readText();
        let clipboardContent = text;

        // console.log(clipboardContent);
        // console.log(findUrl(clipboardContent));
        setTimeout(() => {
        inputText = findUrl(clipboardContent);
        isInputTextEmpty = false
        setAccordionValue('item-1');

        

        if (inputText === null) {
          setTimeout(() => {
            focus1 = false;
            // alert('No Spotify URL found in clipboard');
            isError = true;
            alertDialogTitle = strings.ErrorClipboardNoSpotifyURLTitle;
            alertDialogDescription = strings.ErrorClipboardNoSpotifyURLDesc;
            errorIcon = strings.ErrorClipboardNoSpotifyURLIcon;
            console.log(alertDialogTitle, alertDialogDescription)
          }, 1);
        }
        focus1 = true;
        
        }, 4);
      } else {
        errorIcon = errorIconDefault;
        alertDialogTitle = strings.ErrorClipboardPermTitle;
        alertDialogDescription = strings.ErrorClipboardPermissionDesc;
        isError = true;
        // alert('Clipboard access denied');
      }
    } catch (e) {
      let error = String(e).toLowerCase();

      if (error.includes("denied")) isError = true;
      console.error('Failed to read clipboard: ', error);
      if (error.includes("function") && isFirefox) alert('Firefox does not support clipboard access');
      if (error.includes("dismissed") || isIOS) alert('Sorry! iOS Safari does not support clipboard access 😔');
    }
  }

  
  
    // onMount(() => {
    //     console.log(strings)
    // });
    function escapeSelectHandle() {
        onMount(() => { 
          setTimeout(() => {
            theButton.focus()
          }, 100);
        });
        console.log('something is selected');
    }

    // onMount(() => {
    //   escapeSelectHandle();
    // })

    let promiseResolve, promiseReject;

    let selected = { value: "sptfy.in", label: "Default: sptfy.in"}
    const domainList = [
    { value: "sptfy.in", label: "sptfy.in" },
    { value: "COMING SOON", label: "--- COMING SOON ---", disabled: true },
    { value: "profile", label: "profile.sptfy.in", disabled: true },
    { value: "playlist", label: "playlist.sptfy.in", disabled: true },
    { value: "podcast", label: "podcast.sptfy.in", disabled: true },
    { value: "album", label: "album.sptfy.in", disabled: true },
    { value: "track", label: "track.sptfy.in", disabled: true },
    { value: "artist", label: "artist.sptfy.in", disabled: true }

  ];
  function handleCustomUrl() {
      const value = customShortId;
      const modifiedValue = value.toLocaleLowerCase().replace(/[^a-zA-Z0-9-]/g, '-');
      customShortId = modifiedValue
      shortIdDisplay = modifiedValue
    }

  const handleSubmit = async (e) => {
      // let url_id = '35db'  // debug
      let url_id = customShortId


      if (!customShortId) {
        url_id = await generateRandomURL();
      } 
      let dataForm = {
        from: inputText,
        id_url: url_id,
        subdomain: selected.value,
        enable: true
      }
      try {
        const validationResponse = await validateToken(turnstileResponse);
      if (!validationResponse.success) {
        isError = true;
        alertDialogTitle = strings.ErrorTurnstileValidationTitle;
        alertDialogDescription = strings.ErrorTurnstileValidationDesc + `<br><br<> turnstile error: ${validationResponse.error}`;
        throw new Error(`Turnstile validation failed: ${validationResponse.error}`);
      }
      


          console.log(url_id)
          const response = await createRecord('random_short', dataForm);
          console.log('Record created');
          shortIdDisplay = url_id;
          inputText = '';
          customShortId = '';
          const promise = new Promise(function(resolve, reject){
            promiseResolve = resolve;
            promiseReject = reject;
          });
          toast.promise(promise, {
            class: 'my-toast',
            description: 'The link has been shortened!',
            loading: 'Loading...',
            success: (data) => {
                
                return 'Success 🥳 ';
            },
            error: (err) => {
                // console.error(err);
                // isError = true;
                return 'Error... :( Try again!';
            }
          });
          reset?.()
          promiseResolve();
          fullShortURL = `https://${selected.value}/${url_id}`
          scrollToBottom();

        } catch (err) {
          console.log(err.response.status);
          console.log(err.response);
          alertDialogTitle = strings.ErrorCreateRecordTitle;
          alertDialogDescription = strings.ErrorCreateRecordDesc;
          if (isInputTextEmpty) {
            alertDialogTitle = strings.ErrorCreatedRecordNoInputTitle;
            alertDialogDescription = strings.ErrorCreatedRecordNoInputDesc;
            isError = true;
          }
          isError = true;
          
//          errorIcon = strings.ErrorCreateRecordIcon;
          
        }
    }

 
    async function handleCopy(event) {
    try {
      // Request permission to access the clipboard
      const permission = await navigator.permissions.query({ name: 'clipboard-write' });

      if (permission.state === 'granted' || permission.state === 'prompt') {
        // Write to the clipboard
        await navigator.clipboard.writeText(fullShortURL);
        toast.success("Success 🥳", {
          description: "The link has been copied to your clipboard!",
          action: {
            label: "Okay",
            onClick: () => console.info("Copy")
          }
        });
      } else {
        alert('Clipboard access denied');
      }
    } catch (e) {
      let error = String(e).toLowerCase();

      if (error.includes("denied")) alert('Clipboard access denied');
      console.error('Failed to write to clipboard: ', error);
    }
  }
    



    // console.log(generateRandomURL());
    // $: console.log(selected.value)
    // $: console.log(turnstileResponse)


    // $: console.log('isInput: ' + isInputTextEmpty)


 

</script>




<AlertDialog.Root bind:open={isError} class="transition-all">
  <AlertDialog.Trigger></AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <iconify-icon icon={errorIcon} class="block m-auto text-center" width=120></iconify-icon>
      <AlertDialog.Title class="text-center">Ouch! {@html alertDialogTitle}</AlertDialog.Title>
      
      <AlertDialog.Description>
          {@html alertDialogDescription}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Action class="min-w-full font-semibold" on:click={() => isError = false}>okay, got it</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<div class="flex flex-col items-center justify-center">
  <h1 class="text-8xl font-bold text-primary font-jak-display ss03 md:flex-none hidden md:block translate-y-[12rem]">Sptfy.in</h1>
  <h3 class="pt-5 text-md text-white md:flex-none hidden md:block translate-y-[12rem]">by <a href="https://instagram.com/raaharja" target="_blank">raaharja</a></h3>
  

</div>


<div class="flex flex-col items-center justify-center min-h-screen gap-6 p-10 -translate-y-8 md:flex-row md:items-start md:translate-y-[12.5rem]">
  <h1 class="text-6xl font-bold text-primary font-jak-display ss03 md:flex-none md:hidden">Sptfy.in</h1>
  <h3 class="-mt-2
   text-md text-white md:flex-none md:flex-none md:hidden">by <a href="https://instagram.com/raaharja" target="_blank">raaharja</a></h3>
   <Dialog.Root class="md:flex-none md:flex-none md:hidden -mt-4">
    <Dialog.Trigger> <Button class="hover:bg-primary hover:text-black md:flex-none md:flex-none md:hidden" variant="secondary">💓 Support me </Button> </Dialog.Trigger>
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title></Dialog.Title>
        <Dialog.Description>
          <iframe id='kofiframe' src='https://ko-fi.com/freqtion/?hidefeed=true&widget=true&embed=true&preview=true' style='border:none;width:100%;background:#0A0911;border-radius:0.7em' height='712' title='freqtion'></iframe>
        </Dialog.Description>
      </Dialog.Header>
    </Dialog.Content>
  </Dialog.Root>

  
   
    <Card.Root class="w-[23rem] md:w-[35rem] sm:w-[25rem] transition-all">
        <Card.Header>
          <Card.Title>Shorten your URL</Card.Title>
          <Card.Description>Make your Spotify URLs looks pretty with one click, easy and fast!</Card.Description>
        </Card.Header>
        <Card.Content class="grid gap-4 pb-0">
          
           
      
            <!-- <div class="flex-1 space-y-1">
              <p class="text-sm font-medium leading-none">Push Notifications</p>
              <p class="text-sm text-muted-foreground">
                Send notifications to device.
              </p>
            </div> -->
         
      
          <div>
            <form on:submit|preventDefault={handleSubmit} class="flex flex-col w-[8rem] min-w-full">
                <Label for="url" class="my-2">Paste your long ass URL here</Label>
                <div class="flex w-full min-w-full items-center align-center space-x-3 mb-2">
                    
                    <Input type="url" id="url" on:paste={handlePaste} placeholder="https://open.spotify.com/xxxx...." bind:value={inputText} class="placeholder:translate-y-[2px]" required autofocus/>
                    <Button type="button" class="hover:bg-primary hover:text-black" variant="secondary" on:click={() => handlePaste()}><iconify-icon width="20" icon="lucide:clipboard-copy"></iconify-icon></Button>
                </div>
                
                <Label for="domainSelect" class="my-2">Select domain</Label>
                <Select.Root portal={null} id="domainSelect" name="domainSelect" bind:selected bind:open={focus1} asChild>
                    <Select.Trigger class="">
                      <Select.Value placeholder="Domain: sptfy.in" selected="sptfy.in" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Group>
                        <Select.Label>Select domain</Select.Label>
                        {#each domainList as domain}
                        
                          <Select.Item value={domain.value} label={domain.label} on:click={() => escapeSelectHandle()}
                            disabled={domain.disabled}
                            >{domain.label}</Select.Item
                          >
                        {/each}
                      </Select.Group>
                    </Select.Content>
                    <Select.Input name="sptfy.in"/>
                  </Select.Root>
                  <!-- <Separator class="my-2"/> -->
  
                  <Accordion.Root class="" value={accordionValue} onValueChange={setAccordionValue}>
                    <Accordion.Item value="item-1" class>
                      <Accordion.Trigger>Custom Short URL / back-half (optional) </Accordion.Trigger>
                      <Accordion.Content>
                        <Label for="url" class="my-2">Custom back-half (alias) here</Label>
                        <div class="flex flex-col w-full max-w-[25rem] items-center align-center space-x-2 mb-4">
                            <!-- custom url -->
                            <Input minlength="4" maxlength="80" type="text" id="short_id" placeholder="coolplaylist4" bind:value={customShortId} on:input={handleCustomUrl}/>

                        </div>


                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion.Root>

                  <Turnstile siteKey="0x4AAAAAAAfXWBvVu4QvwLH7" theme="dark" retry='auto' bind:reset
                  on:callback={ event => {
                     turnstileResponse = event.detail.token
                    //  validateToken(turnstileResponse)
                  } 
                 
                  
                  }/>




                  <Button class="w-full mt-4 transition-all" type="submit" bind:this={theButton}> 
                    Short It!
                  </Button>

        
              </form>
          </div>
        </Card.Content>
        <Card.Footer class="flex-col">
         

        </Card.Footer>
      </Card.Root>
      <Card.Root class="w-[23rem] md:w-[35rem] sm:w-[25rem]  transition-all">
        <Card.Header>
          <Card.Title>URL Preview</Card.Title>
          <Card.Description>Here's how your URL will look like</Card.Description>
          <Card.Content class="grid gap-4 text-[#82d1af]/60 text-left px-0 pb-0">
            <div class="flex w-full min-w-full items-center align-center justify-between md:py-2 ">
              <p class="text-[1.44rem] md:text-3xl lg:text-5xl font-semibold break-all">sptfy.in/<span class="text-[#82d1af]">{shortIdDisplay}</span></p>
              {#if fullShortURL}
               <div class="buttons flex md:flex-col-reverse">
                <Button on:click={() => {
                  handleCopy();
                }} variant="secondary" class="hover:bg-primary hover:text-black p-3" >
                    <iconify-icon icon="lucide:copy" class="" width="24">
                  </iconify-icon>
                </Button>
                <Button on:click={() => {
                  //redirect to link;
                  //using window location and just /{urlId} open in new tab

                  window.open(`/${shortIdDisplay}`, '_blank');
                }} variant="secondary" class="hover:bg-primary hover:text-black p-3" >
                    <iconify-icon icon="lucide:square-arrow-out-up-right" class="" width="24">
                  </iconify-icon>
                </Button>
               </div>
             
              {/if}
            </div>
{#if fullShortURL}
<Drawer.Root>
  <Drawer.Trigger>
    <Button variant="secondary" class="w-full">Show QR Code</Button>
  </Drawer.Trigger>
  <Drawer.Content>
    <Drawer.Header>
      <Drawer.Title class="text-center">QR Code</Drawer.Title>
      <Drawer.Description>
        <div class="flex flex-col text-center items-center align-center">
          <p class="mb-4">
            Scan this QR code to open the link on your phone
          </p>
          <img class="min-w-[50%] md:min-w-[20%]" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=https://sptfy.in/{shortIdDisplay}" alt="QR Code" height="200" width="200" />

        </div>
        <!-- <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://sptfy.in/{shortIdDisplay}" alt="QR Code" /> -->
        
      </Drawer.Description>
    </Drawer.Header>
    <Drawer.Footer>
      <Drawer.Close>Close</Drawer.Close>
    </Drawer.Footer>
  </Drawer.Content>
</Drawer.Root>
{/if}
<div class="gap-1" >


<Accordion.Root class="text-foreground p-0 m-0 ">
  <Accordion.Item value="item-1" class>
    <Accordion.Trigger class="py-1">🔗 Recent created links</Accordion.Trigger>
    <Accordion.Content m-0>
      <div class="flex flex-col mt-1 transition-all" id="show-url">

      
      {#await records}
      <p>awaiting...</p>
      {:then records}
      <div class="max-h-fit transition-all break-all">
        {#each records.slice(0, currentItems) as item, i}
         <li transition:slide class="flex w-full min-w-full align-center justify-between my-1 pl-1">
          <a href={item.from} class="font-thin">
            
            sptfy.in/{item.id_url}
          </a>
          <span class="text-white/30 ml-2">
            {localizeDate(item.created)}
          </span>
          
        </li>
        {/each}
      </div>
        {#if currentItems < records.length}
 <Button
		on:click={() => currentItems = currentItems + 4}
    id="loadmore"
    type="button"
    class="w-full my-2 transition-all"
    variant="secondary">
    Show more
  </Button>
  {:else}
  <Button
    on:click={() => currentItems = 4}
    id="loadmore"
    type="button"
    class="w-full my-2 transition-all"
    variant="secondary">
    Show less
  </Button>

{/if}
    {:catch error}
        <p>error</p>
    {/await}
    
  </div>
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>    

<Accordion.Root class="text-foreground p-0 m-0 ">
  <Accordion.Item value="item-1" class>
    <Accordion.Trigger class="py-1">🤔 Work In Progress (info)</Accordion.Trigger>
    <Accordion.Content m-0>
      <Label for="url" class="my-2">About the website</Label>
      <div class="flex flex-col w-full min-w-full items-center space-x-2 mb-2">
        <div class="text-xs">
          website is still under development, so expect some bugs and missing features. <br>
          coming features are : <br>
          <li>analytics</li>
          <li>custom subdomain</li>
          <br>
          bugs? <a href="https://instagram.com/raaharja">contact me</a>
        
        </div>    
      
          
         
      </div>


    </Accordion.Content>
  </Accordion.Item>
  <Dialog.Root class="w-full my-2 transition-all md:flex-none hidden md:block">
    <Dialog.Trigger> <Button class="w-full my-2 transition-all hover:bg-primary hover:text-black  md:flex-none hidden md:block" variant="secondary">💓 Support me </Button> </Dialog.Trigger>
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title></Dialog.Title>
        <Dialog.Description>
          <iframe id='kofiframe' src='https://ko-fi.com/freqtion/?hidefeed=true&widget=true&embed=true&preview=true' style='border:none;width:100%;background:#0A0911;border-radius:0.7em' height='712' title='freqtion'></iframe>
        </Dialog.Description>
      </Dialog.Header>
    </Dialog.Content>
  </Dialog.Root>

</Accordion.Root>
</div>

          </Card.Content>
        </Card.Header>
        
        </Card.Root>
        
       
          
</div>
<div class="scrollhere" bind:this={scrollHere}></div>

<!-- <div class="flex text-left ">
  <p>coming soon features : <br>
    <li>qr code</li> 
    <li>analytics</li>
    <li>custom subdomain & back url</li> 

    <p>the website is half baked so be patient my g</p>
 
</div> -->
